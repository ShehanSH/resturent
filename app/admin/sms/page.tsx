import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  OfferSmsList,
  OrderSmsTable,
  isOfferSms,
  needsSmsRetry,
} from "@/components/admin/sms-log-board";
import { RangeTabs, StatCard } from "@/components/admin/ui";
import { formatNumber } from "@/lib/format";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { listRecentSmsLogs } from "@/lib/sms/sms.service";

const VIEWS = [
  { value: "all", label: "All" },
  { value: "orders", label: "Order updates" },
  { value: "offers", label: "Offers & specials" },
  { value: "failed", label: "Needs retry" },
] as const;

type SmsView = (typeof VIEWS)[number]["value"];

export default async function AdminSmsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requested = typeof params.view === "string" ? params.view : "all";
  const view = VIEWS.some((item) => item.value === requested) ? (requested as SmsView) : "all";
  const [settings, logs] = await Promise.all([getRestaurantSettings(), listRecentSmsLogs()]);

  const orders = logs.filter((log) => !isOfferSms(log));
  const offers = logs.filter(isOfferSms);
  const failed = logs.filter(needsSmsRetry);
  const sent = logs.filter((log) => log.status === "SENT").length;

  const showOrders = view === "all" || view === "orders" || view === "failed";
  const showOffers = view === "all" || view === "offers" || view === "failed";
  const orderRows = view === "failed" ? orders.filter(needsSmsRetry) : orders;
  const offerRows = view === "failed" ? offers.filter(needsSmsRetry) : offers;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Notifications"
        title="SMS log"
        description="Order updates and offer broadcasts are kept in separate lists. Failed messages can be sent again without placing a new order."
        action={
          <Link href="/admin/sms/campaign" className="btn-admin h-10 px-3 text-sm">
            Send offer SMS
          </Link>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Order updates"
          value={formatNumber(orders.length, settings.locale)}
          hint="Pickup, delivery, and cancellation texts"
        />
        <StatCard
          label="Offers & specials"
          value={formatNumber(offers.length, settings.locale)}
          hint="Broadcasts you sent to customer phones"
        />
        <StatCard
          label="Sent"
          value={formatNumber(sent, settings.locale)}
          hint="Accepted by the SMS gateway"
        />
        <StatCard
          label="Needs retry"
          value={formatNumber(failed.length, settings.locale)}
          hint="Failed or skipped messages"
        />
      </div>

      <div className="mb-6">
        <RangeTabs basePath="/admin/sms" value={view} param="view" options={[...VIEWS]} />
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No SMS yet"
          description="Place a test order or send an offer after Text.lk is configured. Messages appear here even if the gateway rejects them."
        />
      ) : (
        <div className="space-y-8">
          {showOrders ? (
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">Order updates</h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Automatic texts when an order is placed, ready, out for delivery, or cancelled.
                </p>
              </div>
              {orderRows.length === 0 ? (
                <p className="text-muted-foreground admin-card px-4 py-8 text-center text-sm">
                  No order texts in this view.
                </p>
              ) : (
                <OrderSmsTable logs={orderRows} timezone={settings.timezone} />
              )}
            </section>
          ) : null}

          {showOffers ? (
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">Offers & specials</h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Each broadcast is grouped with its message, then the numbers it went to.
                </p>
              </div>
              {offerRows.length === 0 ? (
                <p className="text-muted-foreground admin-card px-4 py-8 text-center text-sm">
                  No offer texts in this view.
                </p>
              ) : (
                <OfferSmsList logs={offerRows} timezone={settings.timezone} />
              )}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
