import { AdminPageHeader } from "@/components/admin/page-header";
import { RangeTabs, StatCard } from "@/components/admin/ui";
import { formatMoney, formatNumber } from "@/lib/format";
import {
  getAnalyticsSummary,
  getOrdersByCategory,
  getTopItems,
  resolveRange,
} from "@/lib/services/analytics.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export default async function AdminReportsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const preset = typeof params.range === "string" ? params.range : "7d";
  const settings = await getRestaurantSettings();
  const range = resolveRange(
    preset === "today" || preset === "yesterday" || preset === "30d" || preset === "90d" ? preset : "7d",
    settings.timezone,
  );
  const [summary, categories, items] = await Promise.all([
    getAnalyticsSummary(range),
    getOrdersByCategory(range),
    getTopItems(range, 20),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Reports"
        description="Category and item performance over time."
        action={<RangeTabs basePath="/admin/reports" value={preset} options={RANGES} />}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders" value={formatNumber(summary.total_orders, settings.locale)} />
        <StatCard label="Revenue" value={formatMoney(summary.revenue, settings)} />
        <StatCard label="Items sold" value={formatNumber(summary.items_sold, settings.locale)} />
        <StatCard label="Average order" value={formatMoney(summary.average_order_value, settings)} />
      </div>
      <section className="admin-card p-5">
        <h2 className="text-base font-semibold tracking-tight">Category performance</h2>
        {categories.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">No category sales in this range.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/70 text-sm">
            {categories.map((row) => (
              <li key={row.category_name} className="flex justify-between gap-4 py-2.5">
                <span>{row.category_name}</span>
                <span className="text-muted-foreground">
                  {row.quantity} · {formatMoney(row.revenue, settings)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="admin-card p-5">
        <h2 className="text-base font-semibold tracking-tight">Item performance</h2>
        {items.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">No item sales in this range.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/70 text-sm">
            {items.map((row) => (
              <li key={row.item_name} className="flex justify-between gap-4 py-2.5">
                <span>{row.item_name}</span>
                <span className="text-muted-foreground">
                  {row.quantity} · {formatMoney(row.revenue, settings)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
