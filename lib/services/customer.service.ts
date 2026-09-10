import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { normalisePhone } from "@/lib/validations/common";
import type { CustomerRow } from "@/types/database";

export async function listCustomersForAdmin(): Promise<CustomerRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return data ?? [];
}

export async function findCustomerPhones(phones: string[]): Promise<Set<string>> {
  if (phones.length === 0) return new Set();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("customers").select("phone").in("phone", phones);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.phone));
}

export async function insertCustomers(
  rows: { name: string; phone: string }[],
): Promise<{ added: CustomerRow[]; duplicatePhones: string[] }> {
  if (rows.length === 0) return { added: [], duplicatePhones: [] };

  const env = serverEnv();
  const prepared = rows.map((row) => ({
    name: row.name.trim() || "Customer",
    phone: normalisePhone(row.phone, env.SMS_DEFAULT_COUNTRY_CODE),
  }));

  const existing = await findCustomerPhones(prepared.map((row) => row.phone));
  const duplicatePhones = prepared.filter((row) => existing.has(row.phone)).map((row) => row.phone);
  const fresh = prepared.filter((row) => !existing.has(row.phone));
  if (fresh.length === 0) return { added: [], duplicatePhones };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(fresh)
    .select("*");

  if (error) throw error;
  return { added: data ?? [], duplicatePhones };
}

export async function getCustomersByIds(ids: string[]): Promise<CustomerRow[]> {
  if (ids.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("customers").select("*").in("id", ids);
  if (error) throw error;
  return data ?? [];
}
