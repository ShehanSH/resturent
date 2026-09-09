import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { AdminPageHeader } from "@/components/admin/page-header";
import { RangeTabs, StatCard } from "@/components/admin/ui";
import { formatMoney, formatNumber } from "@/lib/format";
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

export default async function AdminDashboardPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const preset = (typeof params.range === "string" ? params.range : "today") as
    | "today"
    | "yesterday"
    | "7d"
    | "30d";
  const settings = await getRestaurantSettings();
  const range = resolveRange(preset === "yesterday" || preset === "7d" || preset === "30d" ? preset : "today", settings.timezone);

  const [summary, hourly, trend, categories, types, status, top] = await Promise.all([
    getAnalyticsSummary(range),
    getOrdersByHour(range),
    getRevenueTrend(range),
    getOrdersByCategory(range),
    getOrderTypeSplit(range),
    getStatusDistribution(range),
    getTopItems(range, 8),
  ]);

  const cards = [
    { label: "Orders", value: formatNumber(summary.total_orders, settings.locale) },
    { label: "Revenue", value: formatMoney(summary.revenue, settings) },
    { label: "Pending", value: formatNumber(summary.pending_orders, settings.locale) },
    { label: "Completed", value: formatNumber(summary.completed_orders, settings.locale) },
    { label: "Pickup", value: formatNumber(summary.pickup_orders, settings.locale) },
    { label: "Delivery", value: formatNumber(summary.delivery_orders, settings.locale) },
    { label: "Cancelled", value: formatNumber(summary.cancelled_orders, settings.locale) },
    { label: "Average order", value: formatMoney(summary.average_order_value, settings) },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Today’s sales, orders, and menu performance."
        action={<RangeTabs basePath="/admin/dashboard" value={preset} options={[...RANGES]} />}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>
      <DashboardCharts
        hourly={hourly}
        trend={trend}
        categories={categories}
        types={types}
        status={status}
        top={top}
      />
    </div>
  );
}
