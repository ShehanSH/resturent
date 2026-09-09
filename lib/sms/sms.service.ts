import "server-only";

import { serverEnv, siteUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import { buildMessage } from "@/lib/sms/messages";
import { ConsoleSmsProvider, DisabledSmsProvider } from "@/lib/sms/providers/console";
import { GenericRestSmsProvider } from "@/lib/sms/providers/generic-rest";
import type { SmsEvent, SmsProvider } from "@/lib/sms/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalisePhone } from "@/lib/validations/common";
import type { SmsLogRow, SmsStatus } from "@/types/database";

/**
 * SMS orchestration.
 *
 * The single rule this module exists to guarantee: **a failed SMS must never
 * fail an order**. Every path returns normally and records the outcome in
 * `sms_logs` so an administrator can see what happened and retry.
 */

let cachedProvider: SmsProvider | null = null;

/** SMS is on for console (dev logs) or a fully configured generic gateway. */
export function smsNotificationsEnabled(): boolean {
  try {
    const env = serverEnv();
    if (env.SMS_PROVIDER === "disabled") return false;
    if (env.SMS_PROVIDER === "console") return true;
    return Boolean(env.SMS_API_URL && env.SMS_API_KEY && env.SMS_SENDER_ID);
  } catch {
    return false;
  }
}

export function getSmsProvider(): SmsProvider {
  if (cachedProvider) return cachedProvider;

  const env = serverEnv();

  switch (env.SMS_PROVIDER) {
    case "generic": {
      if (!env.SMS_API_URL || !env.SMS_API_KEY || !env.SMS_SENDER_ID) {
        logger.warn("sms.misconfigured", {
          reason: "SMS_PROVIDER=generic requires SMS_API_URL, SMS_API_KEY and SMS_SENDER_ID",
        });
        cachedProvider = new DisabledSmsProvider();
        break;
      }
      cachedProvider = new GenericRestSmsProvider({
        apiUrl: env.SMS_API_URL,
        apiKey: env.SMS_API_KEY,
        apiSecret: env.SMS_API_SECRET,
        senderId: env.SMS_SENDER_ID,
      });
      break;
    }
    case "disabled":
      cachedProvider = new DisabledSmsProvider();
      break;
    case "console":
    default:
      cachedProvider = new ConsoleSmsProvider();
      break;
  }

  return cachedProvider;
}

interface NotifyParams {
  event: SmsEvent;
  orderId: string;
  orderNumber: string;
  customerName: string;
  phoneNumber: string;
  restaurantName: string;
  trackingToken: string;
}

/**
 * Sends a lifecycle notification and records the attempt.
 *
 * Deliberately never throws. Callers may `await` it, or hand it to `after()` so
 * the customer's request is not held open by a slow gateway.
 */
export async function notifyOrderEvent(params: NotifyParams): Promise<void> {
  const { event, orderId, orderNumber, customerName, phoneNumber, restaurantName, trackingToken } =
    params;

  const admin = createSupabaseAdminClient();
  const provider = getSmsProvider();

  const message = buildMessage(event, {
    orderNumber,
    customerName,
    restaurantName,
    trackingUrl: `${siteUrl()}/order/track/${trackingToken}`,
  });

  if (!message) return;

  const env = serverEnv();
  const recipient = normalisePhone(phoneNumber, env.SMS_DEFAULT_COUNTRY_CODE);

  let status: SmsStatus = "PENDING";
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;

  try {
    const result = await provider.send({ phoneNumber: recipient, message });

    if (result.success) {
      status = "SENT";
      providerMessageId = result.providerMessageId ?? null;
    } else if (provider.name === "disabled") {
      status = "SKIPPED";
      errorMessage = result.errorMessage ?? null;
    } else {
      status = "FAILED";
      errorMessage = result.errorMessage ?? "Unknown error";
      logger.warn("sms.send_failed", { event, orderNumber, provider: provider.name });
    }
  } catch (error) {
    status = "FAILED";
    errorMessage = error instanceof Error ? error.message : "Unexpected SMS error";
    logger.error("sms.send_threw", { event, orderNumber, message: errorMessage });
  }

  try {
    await admin.from("sms_logs").insert({
      order_id: orderId,
      phone_number: recipient,
      event_type: event,
      message,
      provider: provider.name,
      status,
      provider_message_id: providerMessageId,
      error_message: errorMessage,
      sent_at: status === "SENT" ? new Date().toISOString() : null,
    });
  } catch (error) {
    // Even the audit write is best-effort; the order must still succeed.
    logger.error("sms.log_failed", {
      orderNumber,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Re-sends a previously failed notification. Returns whether it succeeded. */
export async function retrySmsLog(logId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();

  const { data: log } = await admin.from("sms_logs").select("*").eq("id", logId).maybeSingle();
  if (!log) return false;

  const provider = getSmsProvider();
  const result = await provider.send({
    phoneNumber: log.phone_number,
    message: log.message,
  });

  await admin
    .from("sms_logs")
    .update({
      status: result.success ? "SENT" : "FAILED",
      provider: provider.name,
      provider_message_id: result.providerMessageId ?? null,
      error_message: result.errorMessage ?? null,
      sent_at: result.success ? new Date().toISOString() : null,
    })
    .eq("id", logId);

  return result.success;
}

export type SmsLogListItem = SmsLogRow & {
  orders: { order_number: string } | null;
};

export async function listRecentSmsLogs(limit = 50): Promise<SmsLogListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sms_logs")
    .select("*, orders(order_number)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as SmsLogListItem[];
}
