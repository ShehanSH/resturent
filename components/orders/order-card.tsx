"use client";

import Link from "next/link";
import { Bike, ChevronRight, MapPin } from "lucide-react";

import { StatusBadge } from "@/components/admin/ui";
import { OrderActions } from "@/components/orders/order-actions";
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from "@/lib/constants";
import { formatMoney, formatRelative } from "@/lib/format";
import type { OrderWithItems } from "@/lib/services/order.service";
import type { OrderStatus, PaymentStatus, RestaurantSettingsRow, UserRole } from "@/types/database";

const STATUS_VARIANT: Record<OrderStatus, "success" | "warning" | "danger" | "info" | "neutral" | "brand"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PREPARING: "brand",
  READY: "success",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "neutral",
  PICKED_UP: "neutral",
  CANCELLED: "danger",
};

const PAYMENT_VARIANT: Record<PaymentStatus, "success" | "warning" | "danger" | "neutral"> = {
  PENDING: "warning",
  COLLECTED: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Unpaid",
  COLLECTED: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export function OrderCard({
  order,
  role,
  settings,
  href,
  onUpdated,
}: {
  order: OrderWithItems;
  role: UserRole;
  settings: RestaurantSettingsRow;
  href?: string;
  onUpdated?: (patch: Partial<OrderWithItems> & { id: string }) => void;
}) {
  const detailsHref =
    href ??
    (role === "DELIVERY"
      ? `/delivery/orders/${order.id}`
      : role === "CASHIER"
        ? `/cashier/orders/${order.id}`
        : `/admin/orders/${order.id}`);

  const items = order.order_items ?? [];
  const extraCount = Math.max(items.length - 4, 0);
  const TypeIcon = order.order_type === "DELIVERY" ? Bike : MapPin;

  return (
    <article className="admin-card flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">{order.order_number}</p>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">{order.customer_name}</p>
        </div>
        <StatusBadge variant={STATUS_VARIANT[order.status]}>{ORDER_STATUS_LABELS[order.status]}</StatusBadge>
      </div>

      <p className="text-muted-foreground mt-2 flex items-center gap-1.5 px-4 text-xs">
        <TypeIcon className="size-3.5 shrink-0" aria-hidden />
        {ORDER_TYPE_LABELS[order.order_type]} · {formatRelative(order.created_at)}
      </p>

      <ul className="mx-4 mt-3 space-y-1 border-t border-border/70 pt-3 text-sm">
        {items.slice(0, 4).map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate text-foreground/80">
              {item.quantity} × {item.item_name}
            </span>
          </li>
        ))}
        {extraCount > 0 ? (
          <li className="text-muted-foreground text-xs">+{extraCount} more</li>
        ) : null}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2 px-4">
        <p className="text-sm font-semibold">{formatMoney(order.total, settings)}</p>
        <StatusBadge variant={PAYMENT_VARIANT[order.payment_status]} dot={false}>
          {PAYMENT_LABEL[order.payment_status]}
        </StatusBadge>
      </div>

      <div className="mt-auto space-y-2 border-t border-border/70 bg-[#faf8f6] p-3">
        <OrderActions
          orderId={order.id}
          status={order.status}
          orderType={order.order_type}
          paymentStatus={order.payment_status}
          role={role}
          layout="stack"
          onUpdated={(patch) => onUpdated?.({ id: order.id, ...patch })}
        />
        <Link
          href={detailsHref}
          className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-lg text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground"
        >
          Details
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
