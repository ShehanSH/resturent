"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";

import { collectPaymentAction, updateOrderStatusAction } from "@/app/actions/orders";
import { canCollectOrderPayment } from "@/lib/orders/transitions";
import type { OrderStatus, PaymentStatus } from "@/types/database";

export function DeliveryActions({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  const [pending, setPending] = useState(false);

  async function run(statusTo: OrderStatus) {
    setPending(true);
    const result = await updateOrderStatusAction({ order_id: orderId, status: statusTo });
    setPending(false);
    if (!result.success) notify.error(result.error);
  }

  async function collect() {
    setPending(true);
    const result = await collectPaymentAction({ order_id: orderId });
    setPending(false);
    if (!result.success) notify.error(result.error);
    else notify.success("Payment collected");
  }

  return (
    <div className="mt-4 grid gap-2">
      {status === "READY" ? (
        <button type="button" className="btn-admin h-11 w-full" disabled={pending} onClick={() => void run("OUT_FOR_DELIVERY")}>
          {pending ? "Saving…" : "Start delivery"}
        </button>
      ) : null}
      {status === "OUT_FOR_DELIVERY" ? (
        <>
          {canCollectOrderPayment(status, paymentStatus) ? (
            <button type="button" className="btn-admin-outline h-11 w-full" disabled={pending} onClick={() => void collect()}>
              {pending ? "Saving…" : "Payment collected"}
            </button>
          ) : null}
          <button type="button" className="btn-admin h-11 w-full" disabled={pending} onClick={() => void run("DELIVERED")}>
            {pending ? "Saving…" : "Mark delivered"}
          </button>
        </>
      ) : null}
    </div>
  );
}
