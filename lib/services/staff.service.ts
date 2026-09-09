import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export async function listStaff(): Promise<ProfileRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("active", { ascending: false })
    .order("role", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getStaffMember(id: string): Promise<ProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Guards the "don't lock yourself out" rule: the system must always retain at
 * least one active administrator.
 */
export async function countOtherActiveAdmins(excludingProfileId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "ADMIN")
    .eq("active", true)
    .neq("id", excludingProfileId);

  if (error) throw error;
  return count ?? 0;
}
