/**
 * Creates or resets the shareable demo ADMIN account.
 *
 *   npx tsx scripts/create-demo-admin.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

const EMAIL = "admin@hotbread.lk";
const PASSWORD = "HotBread2026!";
const FULL_NAME = "Demo Admin";

async function findAuthUserByEmail(email: string) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function main() {
  let user = await findAuthUserByEmail(EMAIL);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME, role: "ADMIN" },
    });
    if (error || !data.user) throw error ?? new Error("Could not create the auth user.");
    user = data.user;
    console.log(`Created auth user ${EMAIL}`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME, role: "ADMIN" },
    });
    if (error) throw error;
    console.log(`Reset password for existing user ${EMAIL}`);
  }

  const { data: existingProfile, error: profileReadError } = await admin
    .from("profiles")
    .select("id, role, active")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (profileReadError) throw profileReadError;

  if (!existingProfile) {
    const { error } = await admin.from("profiles").insert({
      auth_user_id: user.id,
      full_name: FULL_NAME,
      phone: null,
      role: "ADMIN",
      active: true,
    });
    if (error) throw error;
    console.log("Created ADMIN profile.");
  } else {
    const { error } = await admin
      .from("profiles")
      .update({ full_name: FULL_NAME, role: "ADMIN", active: true })
      .eq("id", existingProfile.id);
    if (error) throw error;
    console.log("Updated existing profile to active ADMIN.");
  }

  console.log("Demo admin is ready.");
  console.log(`Email:    ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
  console.log("Sign in at /auth/login — same dashboard, orders, catalogue, reports, and settings.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
