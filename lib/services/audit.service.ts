import "server-only";

import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Audit trail for administrative actions.
 *
 * Written with the service role so a failed audit write can never be used to
 * block a legitimate change, and read back only by administrators. Never pass
 * secrets in `metadata` — it is stored verbatim.
 */

export type AuditAction =
  | "category.created"
  | "category.updated"
  | "category.deactivated"
  | "category.deleted"
  | "food_item.created"
  | "food_item.updated"
  | "food_item.price_changed"
  | "food_item.availability_changed"
  | "food_item.deleted"
  | "option_group.created"
  | "option_group.updated"
  | "option_group.deleted"
  | "option.created"
  | "option.updated"
  | "option.deleted"
  | "order.status_changed"
  | "order.delivery_assigned"
  | "order.payment_collected"
  | "staff.created"
  | "staff.updated"
  | "staff.deactivated"
  | "settings.updated"
  | "sms.retried";

interface RecordAuditParams {
  profileId: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordAudit({
  profileId,
  action,
  entity,
  entityId = null,
  metadata = {},
}: RecordAuditParams): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("audit_logs").insert({
      profile_id: profileId,
      action,
      entity,
      entity_id: entityId,
      metadata,
    });
  } catch (error) {
    logger.error("audit.write_failed", {
      action,
      entity,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profile: { full_name: string; role: string } | null;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("audit_logs")
    .select("*, profile:profiles(full_name, role)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as AuditLogEntry[];
}
