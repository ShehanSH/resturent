"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";

import { collectPaymentAction, updateOrderStatusAction } from "@/app/actions/orders";
import { cn } from "@/lib/utils";
import { allowedNextStatuses, canCollectOrderPayment } from "@/lib/orders/transitions";
import type { OrderStatus, OrderType, PaymentStatus, UserRole } from "@/types/database";

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Confirm order",
  PREPARING: "Start preparing",
  READY: "Mark ready",
  OUT_FOR_DELIVERY: "Start delivery",
  PICKED_UP: "Mark picked up",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel order",
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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Customer requested cancellation");
  const allowed = allowedNextStatuses(status, orderType, role);
  const next = allowed.filter((value) => value !== "CANCELLED");
  const canCancel = allowed.includes("CANCELLED");
  const showPayment =
    canCollectOrderPayment(status, paymentStatus) && ["ADMIN", "CASHIER"].includes(role);
  const stacked = layout === "stack";
  const buttonClass = stacked
    ? "h-10 w-full px-3 text-sm"
    : "h-10 min-w-[9.5rem] flex-1 px-4 text-sm";

  async function move(nextStatus: OrderStatus, reason?: string) {
    setPending(nextStatus);
    const result = await updateOrderStatusAction({
      order_id: orderId,
      status: nextStatus,
      cancellation_reason: nextStatus === "CANCELLED" ? reason : undefined,
    });
    setPending(null);
    if (!result.success) {
      notify.error(result.error);
      return;
    }
    if (nextStatus === "CANCELLED") {
      notify.success("Order cancelled. The customer will get an SMS.");
      setCancelOpen(false);
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

  if (next.length === 0 && !showPayment && !canCancel) return null;

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
          className={cn("btn-admin-success", buttonClass)}
          disabled={pending !== null}
          onClick={() => void collect()}
        >
          {pending === "PAY" ? "Saving…" : "Collect payment"}
        </button>
      ) : null}
      {canCancel && !cancelOpen ? (
        <button
          type="button"
          className={cn("btn-admin-danger", buttonClass, "h-10")}
          disabled={pending !== null}
          onClick={() => setCancelOpen(true)}
        >
          Cancel order
        </button>
      ) : null}
      {canCancel && cancelOpen ? (
        <div className="w-full space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <label className="block text-xs font-medium text-rose-950">
            Reason
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={2}
              className="admin-input mt-1 h-auto min-h-16 py-2"
            />
          </label>
          <div className={cn(stacked ? "flex flex-col gap-2" : "flex flex-wrap gap-2")}>
            <button
              type="button"
              className={cn("btn-admin-danger h-10", stacked ? "w-full" : "flex-1")}
              disabled={pending !== null || cancelReason.trim().length < 3}
              onClick={() => void move("CANCELLED", cancelReason.trim())}
            >
              {pending === "CANCELLED" ? "Saving…" : "Confirm cancel"}
            </button>
            <button
              type="button"
              className={cn("btn-admin-outline h-10", stacked ? "w-full" : "flex-1")}
              disabled={pending !== null}
              onClick={() => setCancelOpen(false)}
            >
              Back
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
