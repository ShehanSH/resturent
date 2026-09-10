"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { actionFailure, actionSuccess, toUserMessage, type ActionResult, AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/services/audit.service";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fieldErrorsFrom, uuidSchema } from "@/lib/validations/common";
import {
  categorySchema,
  foodItemSchema,
  optionGroupChoicesSchema,
  optionGroupSchema,
  optionSchema,
} from "@/lib/validations/catalog";
import {
  catalogSeoKeywords,
  categorySeoDescription,
  categorySeoTitle,
  foodItemSeoDescription,
  foodItemSeoTitle,
  seoPlaceName,
} from "@/lib/seo";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { slugify } from "@/lib/format";

function revalidateMenu(extra: { categorySlug?: string | null; productSlug?: string | null } = {}) {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/options");
  if (extra.categorySlug) revalidatePath(`/menu/${extra.categorySlug}`);
  if (extra.productSlug) revalidatePath(`/products/${extra.productSlug}`);
}

async function requireAdminWrite() {
  const profile = await requireRole(["ADMIN"]);
  const limit = await checkRateLimit("admin.catalog", profile.id, 120, 3600);
  if (!limit.allowed) {
    throw new AppError("Too many menu changes in a short time. Please wait a minute and try again.");
  }
  return profile;
}

function requireExistingId(id: string): string {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) throw new AppError("This record could not be found.");
  return parsed.data;
}

export async function upsertCategoryAction(
  id: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please fill required fields.", fieldErrorsFrom(parsed.error));
  }

  try {
    const profile = await requireAdminWrite();
    const settings = await getRestaurantSettings();
    const supabase = await createSupabaseServerClient();

    const location = seoPlaceName(settings.restaurant_name, settings.address);
    const payload = {
      ...parsed.data,
      slug: parsed.data.slug || slugify(parsed.data.name),
      seo_title: categorySeoTitle(parsed.data.name, settings.restaurant_name),
      seo_description: categorySeoDescription({
        name: parsed.data.name,
        restaurantName: settings.restaurant_name,
        description: parsed.data.description,
        location,
      }),
      seo_keywords: catalogSeoKeywords([
        parsed.data.name,
        settings.restaurant_name,
        location,
        "menu",
      ]),
    };

    if (id) {
      const existingId = requireExistingId(id);
      const { error } = await supabase.from("categories").update(payload).eq("id", existingId);
      if (error) throw error;
      await recordAudit({
        profileId: profile.id,
        action: "category.updated",
        entity: "categories",
        entityId: existingId,
      });
      revalidateMenu({ categorySlug: payload.slug });
      return actionSuccess({ id: existingId });
    }

    const { data, error } = await supabase.from("categories").insert(payload).select("id").single();
    if (error) throw error;
    await recordAudit({
      profileId: profile.id,
      action: "category.created",
      entity: "categories",
      entityId: data.id,
    });
    revalidateMenu({ categorySlug: payload.slug });
    return actionSuccess({ id: data.id });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not save this category."));
  }
}

export async function setCategoryActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const profile = await requireAdminWrite();
    const existingId = requireExistingId(id);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("categories").update({ is_active: isActive }).eq("id", existingId);
    if (error) throw error;
    await recordAudit({
      profileId: profile.id,
      action: isActive ? "category.updated" : "category.deactivated",
      entity: "categories",
      entityId: existingId,
    });
    revalidateMenu();
    return actionSuccess({ id: existingId });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not update this category."));
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return actionFailure("This category could not be found.");

  try {
    const profile = await requireAdminWrite();
    const supabase = await createSupabaseServerClient();

    const { data: dishes, error: dishesError } = await supabase
      .from("food_items")
      .select("id")
      .eq("category_id", parsed.data);
    if (dishesError) throw dishesError;

    for (const dish of dishes ?? []) {
      const removed = await deleteFoodItemAction(dish.id);
      if (!removed.success) {
        return actionFailure(
          "This category has dishes used in orders, so it cannot be deleted. Remove unused dishes first, or hide the category.",
        );
      }
    }

    const { error } = await supabase.from("categories").delete().eq("id", parsed.data);
    if (error) throw error;
    await recordAudit({
      profileId: profile.id,
      action: "category.deleted",
      entity: "categories",
      entityId: parsed.data,
    });
    revalidateMenu();
    return actionSuccess({ id: parsed.data });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not delete this category."));
  }
}

export async function upsertFoodItemAction(
  id: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = foodItemSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please fill required fields.", fieldErrorsFrom(parsed.error));
  }

  try {
    const profile = await requireAdminWrite();
    const settings = await getRestaurantSettings();
    const supabase = await createSupabaseServerClient();
    const { option_group_ids, ...rest } = parsed.data;

    let categoryName: string | null = null;
    let categorySlug: string | null = null;
    if (rest.category_id) {
      const { data: category } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("id", rest.category_id)
        .maybeSingle();
      categoryName = category?.name ?? null;
      categorySlug = category?.slug ?? null;
    }

    const location = seoPlaceName(settings.restaurant_name, settings.address);
    const payload = {
      ...rest,
      slug: rest.slug || slugify(rest.name),
      seo_title: foodItemSeoTitle(rest.name, settings.restaurant_name, categoryName),
      seo_description: foodItemSeoDescription({
        name: rest.name,
        restaurantName: settings.restaurant_name,
        shortDescription: rest.short_description,
        description: rest.description,
        categoryName,
        location,
      }),
      seo_keywords: catalogSeoKeywords([
        rest.name,
        categoryName,
        settings.restaurant_name,
        location,
      ]),
    };

    let foodId = id ? requireExistingId(id) : null;
    if (foodId) {
      const { data: previous } = await supabase.from("food_items").select("price").eq("id", foodId).maybeSingle();
      const { error } = await supabase.from("food_items").update(payload).eq("id", foodId);
      if (error) throw error;
      await recordAudit({
        profileId: profile.id,
        action:
          previous && Number(previous.price) !== Number(payload.price)
            ? "food_item.price_changed"
            : "food_item.updated",
        entity: "food_items",
        entityId: foodId,
        metadata: { price: payload.price },
      });
    } else {
      const { data, error } = await supabase.from("food_items").insert(payload).select("id").single();
      if (error) throw error;
      foodId = data.id;
      await recordAudit({
        profileId: profile.id,
        action: "food_item.created",
        entity: "food_items",
        entityId: foodId,
      });
    }

    if (!foodId) throw new Error("Missing food item id");

    await supabase.from("food_item_option_groups").delete().eq("food_item_id", foodId);
    if (option_group_ids.length > 0) {
      const { error } = await supabase.from("food_item_option_groups").insert(
        option_group_ids.map((groupId, index) => ({
          food_item_id: foodId!,
          option_group_id: groupId,
          display_order: index,
        })),
      );
      if (error) throw error;
    }

    revalidateMenu({ productSlug: payload.slug, categorySlug });
    return actionSuccess({ id: foodId });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not save this dish."));
  }
}

export async function setFoodAvailabilityAction(
  id: string,
  isAvailable: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const profile = await requireAdminWrite();
    const existingId = requireExistingId(id);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("food_items").update({ is_available: isAvailable }).eq("id", existingId);
    if (error) throw error;
    await recordAudit({
      profileId: profile.id,
      action: "food_item.availability_changed",
      entity: "food_items",
      entityId: existingId,
      metadata: { is_available: isAvailable },
    });
    revalidateMenu();
    return actionSuccess({ id: existingId });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not update availability."));
  }
}

export async function deleteFoodItemAction(id: string): Promise<ActionResult<{ id: string }>> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return actionFailure("This dish could not be found.");

  try {
    const profile = await requireAdminWrite();
    const supabase = await createSupabaseServerClient();

    const { count, error: orderError } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("food_item_id", parsed.data);
    if (orderError) throw orderError;
    if ((count ?? 0) > 0) {
      return actionFailure("This dish is in existing orders, so it cannot be deleted. Hide it instead.");
    }

    const { error: linksError } = await supabase
      .from("food_item_option_groups")
      .delete()
      .eq("food_item_id", parsed.data);
    if (linksError) throw linksError;

    const { error } = await supabase.from("food_items").delete().eq("id", parsed.data);
    if (error) throw error;
    await recordAudit({
      profileId: profile.id,
      action: "food_item.deleted",
      entity: "food_items",
      entityId: parsed.data,
    });
    revalidateMenu();
    return actionSuccess({ id: parsed.data });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not delete this dish."));
  }
}

export async function upsertOptionGroupAction(
  id: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = optionGroupSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please fill required fields.", fieldErrorsFrom(parsed.error));
  }

  try {
    const profile = await requireAdminWrite();
    const supabase = await createSupabaseServerClient();

    if (id) {
      const existingId = requireExistingId(id);
      const { error } = await supabase.from("option_groups").update(parsed.data).eq("id", existingId);
      if (error) throw error;
      await recordAudit({
        profileId: profile.id,
        action: "option_group.updated",
        entity: "option_groups",
        entityId: existingId,
      });
      revalidateMenu();
      return actionSuccess({ id: existingId });
    }

    const { data, error } = await supabase.from("option_groups").insert(parsed.data).select("id").single();
    if (error) throw error;
    await recordAudit({
      profileId: profile.id,
      action: "option_group.created",
      entity: "option_groups",
      entityId: data.id,
    });
    revalidateMenu();
    return actionSuccess({ id: data.id });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not save this option group."));
  }
}

export async function upsertOptionAction(
  id: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = optionSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please fill required fields.", fieldErrorsFrom(parsed.error));
  }

  try {
    const profile = await requireAdminWrite();
    const supabase = await createSupabaseServerClient();

    if (id) {
      const existingId = requireExistingId(id);
      const { error } = await supabase.from("options").update(parsed.data).eq("id", existingId);
      if (error) throw error;
      await recordAudit({
        profileId: profile.id,
        action: "option.updated",
        entity: "options",
        entityId: existingId,
      });
      revalidateMenu();
      return actionSuccess({ id: existingId });
    }

    const { data, error } = await supabase.from("options").insert(parsed.data).select("id").single();
    if (error) throw error;
    await recordAudit({
      profileId: profile.id,
      action: "option.created",
      entity: "options",
      entityId: data.id,
    });
    revalidateMenu();
    return actionSuccess({ id: data.id });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not save this option."));
  }
}

export async function saveOptionGroupWithChoicesAction(
  id: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const raw = input as { options?: unknown } & Record<string, unknown>;
  const { options, ...groupInput } = raw;
  const groupParsed = optionGroupSchema.safeParse(groupInput);
  const optionsParsed = optionGroupChoicesSchema.safeParse(options);
  if (!groupParsed.success || !optionsParsed.success) {
    return actionFailure("Please fill required fields.", {
      ...(groupParsed.success ? {} : fieldErrorsFrom(groupParsed.error)),
      ...(optionsParsed.success ? {} : { options: optionsParsed.error.issues.map((issue) => issue.message) }),
    });
  }

  try {
    const profile = await requireAdminWrite();
    const supabase = await createSupabaseServerClient();
    let groupId = id;

    if (groupId) {
      groupId = requireExistingId(groupId);
      const { error } = await supabase.from("option_groups").update(groupParsed.data).eq("id", groupId);
      if (error) throw error;
      await recordAudit({
        profileId: profile.id,
        action: "option_group.updated",
        entity: "option_groups",
        entityId: groupId,
      });
    } else {
      const { data, error } = await supabase.from("option_groups").insert(groupParsed.data).select("id").single();
      if (error) throw error;
      groupId = data.id;
      await recordAudit({
        profileId: profile.id,
        action: "option_group.created",
        entity: "option_groups",
        entityId: groupId,
      });
    }

    const keptIds: string[] = [];
    for (const [index, choice] of optionsParsed.data.entries()) {
      const payload = {
        option_group_id: groupId,
        name: choice.name,
        price_adjustment: choice.price_adjustment,
        display_order: index + 1,
        is_available: choice.is_available,
        is_default: choice.is_default,
      };
      if (choice.id) {
        const { error } = await supabase.from("options").update(payload).eq("id", choice.id).eq("option_group_id", groupId);
        if (error) throw error;
        keptIds.push(choice.id);
      } else {
        const { data, error } = await supabase.from("options").insert(payload).select("id").single();
        if (error) throw error;
        keptIds.push(data.id);
      }
    }

    const { data: existing, error: existingError } = await supabase
      .from("options")
      .select("id")
      .eq("option_group_id", groupId);
    if (existingError) throw existingError;
    const removed = (existing ?? []).map((row) => row.id).filter((optionId) => !keptIds.includes(optionId));
    if (removed.length > 0) {
      const { error } = await supabase.from("options").delete().in("id", removed);
      if (error) throw error;
    }

    revalidateMenu();
    return actionSuccess({ id: groupId! });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not save this option group."));
  }
}

export async function deleteOptionGroupAction(id: string): Promise<ActionResult<{ id: string }>> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return actionFailure("That option group could not be found.");

  try {
    const profile = await requireAdminWrite();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("option_groups").delete().eq("id", parsed.data);
    if (error) throw error;
    await recordAudit({
      profileId: profile.id,
      action: "option_group.deleted",
      entity: "option_groups",
      entityId: parsed.data,
    });
    revalidateMenu();
    return actionSuccess({ id: parsed.data });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not delete this option group."));
  }
}
