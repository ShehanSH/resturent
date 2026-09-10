import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderBoard } from "@/components/orders/order-board";
import { ACTIVE_ORDER_STATUSES } from "@/lib/constants";
import { listActiveOrders } from "@/lib/services/order.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { startOfRestaurantDay } from "@/lib/timezone";

export default async function CashierOrdersPage() {
  const settings = await getRestaurantSettings();
  const todayStart = startOfRestaurantDay(settings.timezone, 0);
  const tomorrowStart = startOfRestaurantDay(settings.timezone, 1);
  const [live, cancelled] = await Promise.all([
    listActiveOrders(ACTIVE_ORDER_STATUSES),
    listActiveOrders(["CANCELLED"], { from: todayStart, to: tomorrowStart }),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Counter"
        title="Pickup queue"
        description="Large controls for a tablet. New orders appear without refresh."
      />
      <OrderBoard initialOrders={[...live, ...cancelled]} role="CASHIER" settings={settings} />
    </div>
  );
}
