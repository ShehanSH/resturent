import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, StatusBadge } from "@/components/admin/ui";
import { OrderActions } from "@/components/orders/order-actions";
import { OrderTimeline } from "@/components/orders/timeline";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getOrderDetail } from "@/lib/services/order.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from "@/lib/constants";
import type { OrderStatus, PaymentStatus } from "@/types/database";

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
  PENDING: "danger",
  COLLECTED: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  COLLECTED: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

export default async function CashierOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, order] = await Promise.all([getRestaurantSettings(), getOrderDetail(id)]);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        backHref="/cashier/orders"
        title={order.order_number}
        description={`${ORDER_TYPE_LABELS[order.order_type]} · ${formatDateTime(order.created_at, settings.timezone)}`}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge variant={STATUS_VARIANT[order.status]}>{ORDER_STATUS_LABELS[order.status]}</StatusBadge>
        {order.status !== "CANCELLED" ? (
          <StatusBadge variant={PAYMENT_VARIANT[order.payment_status]}>{PAYMENT_LABEL[order.payment_status]}</StatusBadge>
        ) : null}
      </div>
      <div className="mb-4 max-w-xl">
        <OrderActions
          orderId={order.id}
          status={order.status}
          orderType={order.order_type}
          paymentStatus={order.payment_status}
          role="CASHIER"
        />
      </div>
      <div className="space-y-4">
        <AdminCard className="p-5">
          <h2 className="text-base font-semibold tracking-tight">Customer</h2>
          <p className="mt-2 font-medium">{order.customer_name}</p>
          <a className="text-primary mt-1 inline-block text-sm hover:underline" href={`tel:${order.customer_phone}`}>
            {order.customer_phone}
          </a>
          {order.delivery_address ? <p className="mt-3 text-sm">{order.delivery_address}</p> : null}
        </AdminCard>
        <AdminCard className="p-5">
          <h2 className="text-base font-semibold tracking-tight">Items</h2>
          <ul className="mt-3 space-y-3">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.quantity} × {item.item_name}
                </span>
                <span className="shrink-0 font-medium">{formatMoney(item.line_total, settings)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-border/70 pt-2 font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.total, settings)}</span>
          </p>
        </AdminCard>
        <AdminCard className="p-5">
          <h2 className="mb-4 text-base font-semibold tracking-tight">Status timeline</h2>
          <OrderTimeline
            orderType={order.order_type}
            status={order.status}
            history={order.order_status_history.map((entry) => ({
              status: entry.new_status,
              changed_at: entry.changed_at,
            }))}
            timezone={settings.timezone}
          />
        </AdminCard>
      </div>
    </div>
  );
}
