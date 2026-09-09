import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { RangeTabs, StatCard } from "@/components/admin/ui";
import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { RANGE_PRESET_LABELS, parseRangePreset } from "@/lib/reports/range";
import {
  getAnalyticsSummary,
  getOrderTypeSplit,
  getOrdersByCategory,
  getOrdersByHour,
  getRevenueTrend,
  getStatusDistribution,
  getTopItems,
  resolveRange,
} from "@/lib/services/analytics.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
] as const;

const DASHBOARD_PRESETS = ["today", "yesterday", "7d", "30d"] as const;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requested = parseRangePreset(typeof params.range === "string" ? params.range : undefined, "today");
  const preset = DASHBOARD_PRESETS.includes(requested as (typeof DASHBOARD_PRESETS)[number])
    ? (requested as (typeof DASHBOARD_PRESETS)[number])
    : "today";
  const settings = await getRestaurantSettings();
  const range = resolveRange(preset, settings.timezone);
  const inclusiveTo = new Date(range.to.getTime() - 1);
  const periodLabel = `${formatDate(range.from, settings.timezone, settings.locale)} – ${formatDate(inclusiveTo, settings.timezone, settings.locale)}`;

  const [summary, hourly, trend, categories, types, status, top] = await Promise.all([
    getAnalyticsSummary(range),
    getOrdersByHour(range),
    getRevenueTrend(range),
    getOrdersByCategory(range),
    getOrderTypeSplit(range),
    getStatusDistribution(range),
    getTopItems(range, 8),
  ]);

  const currency = {
    currency: settings.currency,
    currency_symbol: settings.currency_symbol,
    locale: settings.locale,
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Live snapshot of sales, fulfilment, and what is selling."
        action={<RangeTabs basePath="/admin/dashboard" value={preset} options={[...RANGES]} />}
      />

      <div className="admin-toolbar mb-6 justify-between sm:px-4">
        <div className="min-w-0 px-1 py-1">
          <p className="text-sm font-medium text-foreground">{RANGE_PRESET_LABELS[preset]}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {periodLabel} · {settings.timezone}
          </p>
        </div>
        <Link href="/admin/reports" className="btn-admin-outline h-9 px-3 text-sm">
          Open reports
        </Link>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">Snapshot</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">Headline numbers for this period.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Orders"
              value={formatNumber(summary.total_orders, settings.locale)}
              hint={`${formatNumber(summary.completed_orders, settings.locale)} completed · ${formatNumber(summary.cancelled_orders, settings.locale)} cancelled`}
            />
            <StatCard
              label="Revenue"
              value={formatMoney(summary.revenue, currency)}
              hint={
                summary.uncollected_payments > 0
                  ? `${formatNumber(summary.uncollected_payments, settings.locale)} still uncollected`
                  : "Collected and completed sales"
              }
            />
            <StatCard
              label="Items sold"
              value={formatNumber(summary.items_sold, settings.locale)}
              hint="Line items across all orders"
            />
            <StatCard
              label="Average order"
              value={formatMoney(summary.average_order_value, currency)}
              hint="Revenue divided by orders"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Pending"
              value={formatNumber(summary.pending_orders, settings.locale)}
              hint="Waiting for kitchen confirmation"
            />
            <StatCard
              label="Active"
              value={formatNumber(summary.active_orders, settings.locale)}
              hint="Confirmed through out for delivery"
            />
            <StatCard
              label="Pickup"
              value={formatNumber(summary.pickup_orders, settings.locale)}
              hint="Customer collection"
            />
            <StatCard
              label="Delivery"
              value={formatNumber(summary.delivery_orders, settings.locale)}
              hint="Sent out with a rider"
            />
          </div>
        </section>

        <DashboardCharts
          hourly={hourly}
          trend={trend}
          categories={categories}
          types={types}
          status={status}
          top={top}
          currency={currency}
        />
      </div>
    </div>
  );
}
