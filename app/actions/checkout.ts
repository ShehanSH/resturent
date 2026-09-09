"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { actionFailure, actionSuccess, toUserMessage, type ActionResult } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createGuestOrder } from "@/lib/services/checkout.service";
import { clientIpFrom } from "@/lib/services/rate-limit";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { notifyOrderEvent, smsNotificationsEnabled } from "@/lib/sms/sms.service";
import { checkoutSchema } from "@/lib/validations/order";
import { fieldErrorsFrom } from "@/lib/validations/common";
import type { OrderRow } from "@/types/database";

export async function placeOrderAction(
  input: unknown,
): Promise<ActionResult<{ orderNumber: string; trackingToken: string; total: number }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailure("Please fill required fields.", fieldErrorsFrom(parsed.error));
  }

  try {
    const headerList = await headers();
    const order = await createGuestOrder(parsed.data, {
      ipAddress: clientIpFrom(headerList),
    });

    if (smsNotificationsEnabled()) {
      const settings = await getRestaurantSettings();
      after(() =>
        notifyOrderEvent({
          event: "ORDER_PLACED",
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          phoneNumber: order.customer_phone,
          restaurantName: settings.restaurant_name,
          trackingToken: order.tracking_token,
        }).catch((error) => {
          logger.warn("sms.after_failed", {
            message: error instanceof Error ? error.message : String(error),
          });
        }),
      );
    }

    revalidatePath("/admin/orders");
    revalidatePath("/cashier/orders");

    return actionSuccess({
      orderNumber: order.order_number,
      trackingToken: order.tracking_token,
      total: Number(order.total),
    });
  } catch (error) {
    logger.error("checkout.failed", {
      message: error instanceof Error ? error.message : String(error),
      code:
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : undefined,
    });
    return actionFailure(toUserMessage(error, "We could not place your order. Please try again."));
  }
}

export type PlacedOrder = Pick<OrderRow, "order_number" | "tracking_token" | "total">;
