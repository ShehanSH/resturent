import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, StatusBadge } from "@/components/admin/ui";
import { DeliveryActions } from "@/components/delivery/delivery-actions";
import { formatMoney } from "@/lib/format";
import { getOrderDetail } from "@/lib/services/order.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export default async function DeliveryOrderDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, order] = await Promise.all([getRestaurantSettings(), getOrderDetail(id)]);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg pb-8">
      <AdminPageHeader
        backHref="/delivery/orders"
        title={order.order_number}
        description={order.customer_name}
      />
      <div className="mb-4">
        <StatusBadge variant={order.status === "READY" ? "success" : order.status === "DELIVERED" ? "neutral" : "info"}>
          {ORDER_STATUS_LABELS[order.status]}
        </StatusBadge>
      </div>
      <AdminCard className="space-y-4 p-5">
        <a className="btn-admin inline-flex w-full" href={`tel:${order.customer_phone}`}>
          Call customer
        </a>
        {order.delivery_address ? (
          <a
            className="btn-admin-outline inline-flex w-full"
            href={`https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Maps
          </a>
        ) : null}
        {order.delivery_address ? <p className="text-sm">{order.delivery_address}</p> : null}
        {order.delivery_notes ? <p className="text-muted-foreground text-sm">{order.delivery_notes}</p> : null}
        <ul className="space-y-2 border-t border-border/70 pt-4 text-sm">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.quantity} × {item.item_name}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xl font-semibold tracking-tight">Collect {formatMoney(order.total, settings)}</p>
        <DeliveryActions orderId={order.id} status={order.status} paymentStatus={order.payment_status} />
      </AdminCard>
    </div>
  );
}
