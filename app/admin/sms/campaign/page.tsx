import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { SmsCampaignPanel } from "@/components/admin/sms-campaign-panel";
import { listCustomersForAdmin } from "@/lib/services/customer.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { smsNotificationsEnabled } from "@/lib/sms/sms.service";
import { siteUrl } from "@/lib/env";

export default async function AdminSmsCampaignPage() {
  const [settings, customers] = await Promise.all([getRestaurantSettings(), listCustomersForAdmin()]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Notifications"
        title="Offers & specials"
        description="Text weekend specials and offers to customer phones. Saved order numbers are ready to use; new numbers are checked against the list so you cannot add the same mobile twice."
        backHref="/admin/sms"
        action={
          <Link href="/admin/sms" className="btn-admin-outline h-10 px-3 text-sm">
            SMS log
          </Link>
        }
      />
      <SmsCampaignPanel
        customers={customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          total_orders: customer.total_orders,
        }))}
        restaurantName={settings.restaurant_name}
        orderUrl={siteUrl().includes("localhost") ? "https://hotbreadberuwala.vercel.app" : siteUrl()}
        smsEnabled={smsNotificationsEnabled()}
      />
    </div>
  );
}
