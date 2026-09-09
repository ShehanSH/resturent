"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { actionFailure, actionSuccess, toUserMessage, type ActionResult } from "@/lib/errors";
import { recordAudit } from "@/lib/services/audit.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fieldErrorsFrom } from "@/lib/validations/common";
import {
  createStaffSchema,
  restaurantSettingsSchema,
  updateStaffSchema,
} from "@/lib/validations/settings";
import { countOtherActiveAdmins } from "@/lib/services/staff.service";
import { AppError } from "@/lib/errors";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES, STORAGE_BUCKETS } from "@/lib/constants";

export async function updateSettingsAction(input: unknown): Promise<ActionResult<{ saved: true }>> {
  const parsed = restaurantSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please fill required fields.", fieldErrorsFrom(parsed.error));
  }

  try {
    const profile = await requireRole(["ADMIN"]);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("restaurant_settings").update(parsed.data).eq("is_singleton", true);
    if (error) throw error;
    await recordAudit({
      profileId: profile.id,
      action: "settings.updated",
      entity: "restaurant_settings",
    });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return actionSuccess({ saved: true });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not save restaurant settings."));
  }
}

export async function createStaffAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createStaffSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please fill required fields.", fieldErrorsFrom(parsed.error));
  }

  try {
    const actor = await requireRole(["ADMIN"]);
    const admin = createSupabaseAdminClient();

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.full_name, role: parsed.data.role },
    });

    if (createError || !created.user) {
      throw createError ?? new Error("Could not create the auth user.");
    }

    const { data: profile, error } = await admin
      .from("profiles")
      .insert({
        auth_user_id: created.user.id,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        role: parsed.data.role,
        active: true,
      })
      .select("id")
      .single();

    if (error) throw error;

    await recordAudit({
      profileId: actor.id,
      action: "staff.created",
      entity: "profiles",
      entityId: profile.id,
      metadata: { role: parsed.data.role },
    });

    revalidatePath("/admin/staff");
    return actionSuccess({ id: profile.id });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not create this staff member."));
  }
}

export async function updateStaffAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = updateStaffSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please fill required fields.", fieldErrorsFrom(parsed.error));
  }

  try {
    const actor = await requireRole(["ADMIN"]);

    if (parsed.data.role !== "ADMIN" || !parsed.data.active) {
      const remaining = await countOtherActiveAdmins(parsed.data.id);
      if (remaining < 1) {
        throw new AppError("Keep at least one active administrator.", "LAST_ADMIN");
      }
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        role: parsed.data.role,
        active: parsed.data.active,
      })
      .eq("id", parsed.data.id);

    if (error) throw error;

    await recordAudit({
      profileId: actor.id,
      action: parsed.data.active ? "staff.updated" : "staff.deactivated",
      entity: "profiles",
      entityId: parsed.data.id,
    });

    revalidatePath("/admin/staff");
    return actionSuccess({ id: parsed.data.id });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not update this staff member."));
  }
}

export async function uploadImageAction(
  bucket: (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS],
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    await requireRole(["ADMIN"]);
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return actionFailure("Choose an image to upload.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return actionFailure("Images must be 5 MB or smaller.");
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      return actionFailure("Use a JPEG, PNG, WebP or AVIF image.");
    }

    const supabase = await createSupabaseServerClient();
    const extension = file.type.split("/")[1] ?? "jpg";
    const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return actionSuccess({ url: data.publicUrl });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not upload this image."));
  }
}
