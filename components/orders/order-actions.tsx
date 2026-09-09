"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";

import { collectPaymentAction, updateOrderStatusAction } from "@/app/actions/orders";
import { cn } from "@/lib/utils";
import { allowedNextStatuses } from "@/lib/orders/transitions";
import type { OrderStatus, OrderType, PaymentStatus, UserRole } from "@/types/database";

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Confirm order",
  PREPARING: "Start preparing",
  READY: "Mark ready",
  OUT_FOR_DELIVERY: "Start delivery",
  PICKED_UP: "Mark picked up",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel",
};

export function OrderActions({
  orderId,
  status,
  orderType,
  paymentStatus,
  role,
  layout = "row",
  onUpdated,
}: {
  orderId: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;
  role: UserRole;
  layout?: "row" | "stack";
  onUpdated?: (patch: { status?: OrderStatus; payment_status?: PaymentStatus }) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<OrderStatus | "PAY" | null>(null);
  const next = allowedNextStatuses(status, orderType, role).filter((value) => value !== "CANCELLED");
  const showPayment = paymentStatus === "PENDING" && ["ADMIN", "CASHIER"].includes(role);
  const stacked = layout === "stack";
  const buttonClass = stacked
    ? "h-10 w-full px-3 text-sm"
    : "h-10 min-w-[9.5rem] flex-1 px-4 text-sm";

  async function move(nextStatus: OrderStatus) {
    setPending(nextStatus);
    const result = await updateOrderStatusAction({
      order_id: orderId,
      status: nextStatus,
      cancellation_reason: nextStatus === "CANCELLED" ? "Cancelled by staff" : undefined,
    });
    setPending(null);
    if (!result.success) {
      notify.error(result.error);
      return;
    }
    onUpdated?.({ status: result.data.status, payment_status: result.data.payment_status });
    router.refresh();
  }

  async function collect() {
    setPending("PAY");
    const result = await collectPaymentAction({ order_id: orderId });
    setPending(null);
    if (!result.success) {
      notify.error(result.error);
      return;
    }
    notify.success("Payment collected");
    onUpdated?.({ payment_status: "COLLECTED" });
    router.refresh();
  }

  if (next.length === 0 && !showPayment) return null;

  return (
    <div className={cn(stacked ? "flex w-full flex-col gap-2" : "flex w-full flex-wrap gap-2")}>
      {next.map((nextStatus) => (
        <button
          key={nextStatus}
          type="button"
          className={cn("btn-admin", buttonClass)}
          disabled={pending !== null}
          onClick={() => void move(nextStatus)}
        >
          {pending === nextStatus ? "Saving…" : ACTION_LABELS[nextStatus] ?? nextStatus}
        </button>
      ))}
      {showPayment ? (
        <button
          type="button"
          className={cn("btn-admin-outline", buttonClass)}
          disabled={pending !== null}
          onClick={() => void collect()}
        >
          {pending === "PAY" ? "Saving…" : "Collect payment"}
        </button>
      ) : null}
    </div>
  );
}
