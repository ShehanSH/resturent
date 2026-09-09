import { AdminPageHeader } from "@/components/admin/page-header";
import { ReportsDashboard } from "@/components/admin/reports-dashboard";
import { RangeTabs } from "@/components/admin/ui";
import { buildReportDocument } from "@/lib/reports/model";
import { parseRangePreset } from "@/lib/reports/range";
import {
  getAnalyticsSummary,
  getOrderTypeSplit,
  getOrdersByCategory,
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
  { value: "90d", label: "90 days" },
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const preset = parseRangePreset(typeof params.range === "string" ? params.range : undefined);
  const settings = await getRestaurantSettings();
  const range = resolveRange(preset, settings.timezone);
  const [summary, categories, items, trend, types, status] = await Promise.all([
    getAnalyticsSummary(range),
    getOrdersByCategory(range),
    getTopItems(range, 25),
    getRevenueTrend(range),
    getOrderTypeSplit(range),
    getStatusDistribution(range),
  ]);

  const report = buildReportDocument({
    restaurantName: settings.restaurant_name,
    rangePreset: preset,
    range,
    timezone: settings.timezone,
    locale: settings.locale,
    currency: {
      currency: settings.currency,
      currency_symbol: settings.currency_symbol,
      locale: settings.locale,
    },
    summary,
    trend,
    categories,
    items,
    types,
    status,
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Analytics"
        title="Reports"
        description="Sales, category, and item performance. Download a PDF or Excel file for the selected period."
        action={<RangeTabs basePath="/admin/reports" value={preset} options={RANGES} />}
      />
      <ReportsDashboard report={report} />
    </div>
  );
}
