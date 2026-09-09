import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderBoard } from "@/components/orders/order-board";
import { ACTIVE_ORDER_STATUSES } from "@/lib/constants";
import { listActiveOrders } from "@/lib/services/order.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";

export default async function CashierOrdersPage() {
  const settings = await getRestaurantSettings();
  const orders = await listActiveOrders(ACTIVE_ORDER_STATUSES);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Counter"
        title="Pickup queue"
        description="Large controls for a tablet. New orders appear without refresh."
      />
      <OrderBoard initialOrders={orders} role="CASHIER" settings={settings} />
    </div>
  );
}
