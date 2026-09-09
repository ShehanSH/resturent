import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { OrderTimeline } from "@/components/orders/timeline";
import { isSupabaseConfigured } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { getTrackedOrder } from "@/lib/services/checkout.service";
import { clientIpFrom } from "@/lib/services/rate-limit";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { buildMetadata } from "@/lib/seo";
import type { OrderStatus, OrderType } from "@/types/database";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Track order", robots: { index: false, follow: false } };
}

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isSupabaseConfigured) notFound();

  const headerList = await headers();
  const [settings, order] = await Promise.all([
    getRestaurantSettings(),
    getTrackedOrder(token, clientIpFrom(headerList)),
  ]);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Order tracking</p>
      <h1 className="font-heading mt-1 text-3xl tracking-wide text-primary uppercase">{order.order_number}</h1>
      <p className="mt-2 text-foreground/75">
        {order.order_type === "DELIVERY" ? "Delivery" : "Pickup"} · {order.customer_name}
      </p>
      <div className="mt-8 brand-card p-6">
        <OrderTimeline
          orderType={order.order_type as OrderType}
          status={order.status as OrderStatus}
          history={order.history.map((entry) => ({
            status: entry.status as OrderStatus,
            changed_at: entry.changed_at,
          }))}
          timezone={settings.timezone}
        />
      </div>
      <ul className="mt-8 space-y-3">
        {order.items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
            <div>
              <p className="font-medium">{item.quantity} × {item.name}</p>
              {item.options.length > 0 ? (
                <p className="text-muted-foreground mt-1 text-sm">
                  {item.options.map((option) => option.option_name).join(", ")}
                </p>
              ) : null}
            </div>
            <p className="font-semibold text-primary">{formatMoney(item.line_total, settings)}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex justify-between rounded-xl bg-primary/5 px-5 py-4 text-lg font-semibold">
        <span>Total</span>
        <span className="text-primary">{formatMoney(order.total, settings)}</span>
      </p>
    </div>
  );
}
