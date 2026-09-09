"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { actionFailure, actionSuccess, toUserMessage, type ActionResult } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/services/audit.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { eventForStatus } from "@/lib/sms/messages";
import { notifyOrderEvent, smsNotificationsEnabled } from "@/lib/sms/sms.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fieldErrorsFrom } from "@/lib/validations/common";
import {
  assignDeliverySchema,
  collectPaymentSchema,
  updateStatusSchema,
} from "@/lib/validations/order";
import type { OrderRow } from "@/types/database";

export async function updateOrderStatusAction(input: unknown): Promise<ActionResult<OrderRow>> {
  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please fill required fields.", fieldErrorsFrom(parsed.error));
  }

  try {
    const profile = await requireRole(["ADMIN", "CASHIER", "DELIVERY"]);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc("update_order_status", {
      p_order_id: parsed.data.order_id,
      p_new_status: parsed.data.status,
      p_notes: parsed.data.notes,
      p_cancellation_reason: parsed.data.cancellation_reason,
    });

    if (error) throw error;
    const order = data as unknown as OrderRow;

    await recordAudit({
      profileId: profile.id,
      action: "order.status_changed",
      entity: "orders",
      entityId: order.id,
      metadata: { from: null, to: order.status, order_number: order.order_number },
    });

    const event = eventForStatus(order.status, order.order_type);
    if (event && smsNotificationsEnabled()) {
      const settings = await getRestaurantSettings();
      after(() =>
        notifyOrderEvent({
          event,
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          phoneNumber: order.customer_phone,
          restaurantName: settings.restaurant_name,
          trackingToken: order.tracking_token,
        }).catch((err) => {
          logger.warn("sms.after_failed", {
            message: err instanceof Error ? err.message : String(err),
          });
        }),
      );
    }

    revalidateStaffOrderViews();
    return actionSuccess(order);
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not update this order."));
  }
}

export async function assignDeliveryAction(input: unknown): Promise<ActionResult<OrderRow>> {
  const parsed = assignDeliverySchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please choose a delivery rider.", fieldErrorsFrom(parsed.error));
  }

  try {
    const profile = await requireRole(["ADMIN", "CASHIER"]);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc("assign_delivery_user", {
      p_order_id: parsed.data.order_id,
      p_profile_id: parsed.data.profile_id,
    });
    if (error) throw error;

    const order = data as unknown as OrderRow;
    await recordAudit({
      profileId: profile.id,
      action: "order.delivery_assigned",
      entity: "orders",
      entityId: order.id,
      metadata: { rider_id: parsed.data.profile_id, order_number: order.order_number },
    });

    revalidateStaffOrderViews();
    return actionSuccess(order);
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not assign this delivery."));
  }
}

export async function collectPaymentAction(input: unknown): Promise<ActionResult<{ collected: true }>> {
  const parsed = collectPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Invalid payment request.", fieldErrorsFrom(parsed.error));
  }

  try {
    const profile = await requireRole(["ADMIN", "CASHIER", "DELIVERY"]);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc("collect_order_payment", {
      p_order_id: parsed.data.order_id,
      p_notes: parsed.data.notes,
    });
    if (error) throw error;
    void data;

    await recordAudit({
      profileId: profile.id,
      action: "order.payment_collected",
      entity: "orders",
      entityId: parsed.data.order_id,
    });

    revalidateStaffOrderViews();
    return actionSuccess({ collected: true });
  } catch (error) {
    return actionFailure(toUserMessage(error, "Could not record payment."));
  }
}

function revalidateStaffOrderViews() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
  revalidatePath("/cashier/orders");
  revalidatePath("/delivery/orders");
}
