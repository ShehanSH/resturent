"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { homePathForRole } from "@/lib/auth/session";
import { actionFailure, actionSuccess, toUserMessage, type ActionResult } from "@/lib/errors";
import { checkRateLimit, clientIpFrom } from "@/lib/services/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fieldErrorsFrom } from "@/lib/validations/common";
import { loginSchema } from "@/lib/validations/settings";

export async function loginAction(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please fill required fields.", fieldErrorsFrom(parsed.error));
  }

  try {
    const headerList = await headers();
    const byIp = await checkRateLimit("auth:login", clientIpFrom(headerList), 20, 900);
    if (!byIp.allowed) {
      return actionFailure("Too many sign-in attempts. Please wait a few minutes and try again.");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return actionFailure("Those credentials are not recognised.");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return actionFailure("Those credentials are not recognised.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!profile || !profile.active) {
      await supabase.auth.signOut();
      return actionFailure("This account is not active. Ask an administrator for access.");
    }

    return actionSuccess({ redirectTo: homePathForRole(profile.role) });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not sign you in."));
  }
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
