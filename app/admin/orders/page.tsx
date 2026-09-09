import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderBoard } from "@/components/orders/order-board";
import { ACTIVE_ORDER_STATUSES, TERMINAL_ORDER_STATUSES } from "@/lib/constants";
import { listActiveOrders } from "@/lib/services/order.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";

export default async function AdminOrdersPage() {
  const settings = await getRestaurantSettings();
  const orders = await listActiveOrders([...ACTIVE_ORDER_STATUSES, ...TERMINAL_ORDER_STATUSES]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Kitchen"
        title="Orders"
        description="Live pickup and delivery orders. Status updates appear without refresh."
      />
      <OrderBoard initialOrders={orders} role="ADMIN" settings={settings} />
    </div>
  );
}
