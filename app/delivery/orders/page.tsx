import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, StatusBadge } from "@/components/admin/ui";
import { EmptyState } from "@/components/empty-state";
import { formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { listMyDeliveries } from "@/lib/services/order.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { DeliveryActions } from "@/components/delivery/delivery-actions";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export default async function DeliveryOrdersPage() {
  const profile = await requireRole(["DELIVERY"], "/delivery/orders");
  const [settings, orders] = await Promise.all([
    getRestaurantSettings(),
    listMyDeliveries(profile.id),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <AdminPageHeader
        eyebrow="On the road"
        title="My deliveries"
        description="Assigned drop-offs appear here as soon as the counter sends them out."
      />
      {orders.length === 0 ? (
        <EmptyState
          title="No delivery orders assigned"
          description="When the counter assigns a drop-off, it will appear here."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <AdminCard key={order.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold tracking-tight">{order.order_number}</p>
                  <p className="mt-0.5">{order.customer_name}</p>
                </div>
                <StatusBadge variant={order.status === "READY" ? "success" : "info"}>
                  {ORDER_STATUS_LABELS[order.status]}
                </StatusBadge>
              </div>
              <a className="text-primary mt-2 inline-block text-sm hover:underline" href={`tel:${order.customer_phone}`}>
                {order.customer_phone}
              </a>
              <p className="mt-3 text-sm">{order.delivery_address}</p>
              <p className="mt-3 font-semibold">Collect {formatMoney(order.total, settings)} cash</p>
              <Link href={`/delivery/orders/${order.id}`} className="btn-admin-outline mt-3 inline-flex">
                Open order
              </Link>
              <DeliveryActions orderId={order.id} status={order.status} paymentStatus={order.payment_status} />
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
