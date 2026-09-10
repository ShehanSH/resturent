import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow, UserRole } from "@/types/database";

/**
 * Server-side session and authorization helpers.
 *
 * `cache()` deduplicates the lookup within a single render pass, so a layout
 * and the page beneath it share one round-trip instead of two.
 *
 * These checks are a convenience for routing and UI, not the security
 * boundary — Row Level Security independently enforces every rule in Postgres.
 */

export const getCurrentProfile = cache(async (): Promise<ProfileRow | null> => {
  const supabase = await createSupabaseServerClient();

  // getUser() revalidates the JWT with Supabase rather than trusting the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const profile = data as ProfileRow | null;
  if (!profile || !profile.active) return null;

  return profile;
});

/** Redirects signed-out visitors to the login page, preserving where they were headed. */
export async function requireProfile(redirectTo?: string): Promise<ProfileRow> {
  const profile = await getCurrentProfile();

  if (!profile) {
    const target = redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth/login";
    redirect(target);
  }

  return profile;
}

/** Requires one of the given roles, otherwise sends the user to the 403 page. */
export async function requireRole(
  roles: readonly UserRole[],
  redirectTo?: string,
): Promise<ProfileRow> {
  const profile = await requireProfile(redirectTo);

  if (!roles.includes(profile.role)) {
    redirect("/forbidden");
  }

  return profile;
}

/** The landing page each role should see after signing in. */
export function homePathForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "CASHIER":
      return "/cashier/orders";
    case "DELIVERY":
      return "/delivery/orders";
  }
}
