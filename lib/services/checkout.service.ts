import "server-only";

import { serverEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalisePhone } from "@/lib/validations/common";
import type { CheckoutInput } from "@/lib/validations/order";
import type { OrderRow } from "@/types/database";

/**
 * Guest checkout.
 *
 * Runs with the service role because an anonymous visitor has no session, but
 * the trust boundary is not weakened: the only thing forwarded to the database
 * is the customer's contact details plus a list of item ids, quantities and
 * option ids. `public.create_order` looks up every price itself, so there is
 * no parameter through which a tampered client could influence the total.
 */

export interface CreateOrderMeta {
  ipAddress: string;
}

export async function createGuestOrder(
  input: CheckoutInput,
  meta: CreateOrderMeta,
): Promise<OrderRow> {
  const env = serverEnv();
  const phone = normalisePhone(input.customer_phone, env.SMS_DEFAULT_COUNTRY_CODE);

  // Two independent limits: one on the network origin, one on the phone number,
  // so neither a single machine nor a single number can flood the kitchen.
  const [byIp, byPhone] = await Promise.all([
    checkRateLimit("order:ip", meta.ipAddress, env.ORDER_RATE_LIMIT_PER_HOUR),
    checkRateLimit("order:phone", phone, env.ORDER_RATE_LIMIT_PER_HOUR),
  ]);

  if (!byIp.allowed || !byPhone.allowed) {
    throw new AppError(
      "We have received several orders from you recently. Please wait a few minutes or call us to order.",
      "RATE_LIMITED",
    );
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.rpc("create_order", {
    p_customer_name: input.customer_name,
    p_customer_phone: phone,
    p_customer_email: input.customer_email,
    p_order_type: input.order_type,
    p_delivery_address: input.order_type === "DELIVERY" ? input.delivery_address : null,
    p_delivery_notes: input.order_type === "DELIVERY" ? input.delivery_notes : null,
    p_customer_notes: input.customer_notes,
    p_items: input.items.map((item) => ({
      food_item_id: item.food_item_id,
      quantity: item.quantity,
      option_ids: item.option_ids,
      notes: item.notes,
    })),
  });

  if (error) throw error;

  const order = data as unknown as OrderRow;

  logger.info("order.created", {
    order_number: order.order_number,
    order_type: order.order_type,
    total: order.total,
    item_count: input.items.length,
  });

  return order;
}

export interface TrackedOrder {
  order_number: string;
  order_type: "PICKUP" | "DELIVERY";
  status: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  customer_name: string;
  delivery_address: string | null;
  payment_status: string;
  estimated_ready_at: string | null;
  created_at: string;
  cancellation_reason: string | null;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    notes: string | null;
    options: { group_name: string; option_name: string; price_adjustment: number }[];
  }[];
  history: { status: string; changed_at: string }[];
}

/**
 * Public order tracking. Reads through a database function that returns a
 * deliberately narrow projection — no ids, no staff names, no internal notes.
 */
export async function getTrackedOrder(token: string, ipAddress?: string): Promise<TrackedOrder | null> {
  if (!token || token.length < 32 || token.length > 128) return null;

  if (ipAddress) {
    const limit = await checkRateLimit("track:ip", ipAddress, 60, 3600);
    if (!limit.allowed) {
      logger.warn("order.tracking_rate_limited", {});
      return null;
    }
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("get_order_tracking", { p_token: token });

  if (error) {
    logger.error("order.tracking_failed", { message: error.message });
    return null;
  }

  return (data as unknown as TrackedOrder | null) ?? null;
}
