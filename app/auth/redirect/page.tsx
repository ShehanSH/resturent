import { redirect } from "next/navigation";

import { getCurrentProfile, homePathForRole } from "@/lib/auth/session";

export default async function AuthRedirectPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");
  redirect(homePathForRole(profile.role));
}
