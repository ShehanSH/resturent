import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, type CurrencyConfig } from "@/lib/format";
import { RANGE_PRESET_LABELS, type ReportRangePreset } from "@/lib/reports/range";
import type {
  AnalyticsSummary,
  CategoryPerformance,
  DateRangeArgs,
  ItemPerformance,
  StatusSlice,
  TrendPoint,
  TypeSlice,
} from "@/lib/services/analytics.types";

export interface RankedRow {
  name: string;
  quantity: number;
  revenue: number;
  average: number;
  share: number;
  bar: number;
}

export interface ReportDocument {
  restaurantName: string;
  rangePreset: ReportRangePreset;
  rangeLabel: string;
  periodLabel: string;
  generatedAt: string;
  timezone: string;
  currency: CurrencyConfig;
  summary: AnalyticsSummary;
  trend: TrendPoint[];
  categories: RankedRow[];
  items: RankedRow[];
  types: TypeSlice[];
  status: StatusSlice[];
  fileBase: string;
}

export function sharePercent(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function rankPerformance(
  rows: Array<{ name: string; quantity: number; revenue: number }>,
  totalRevenue: number,
): RankedRow[] {
  const maxRevenue = rows.reduce((max, row) => Math.max(max, row.revenue), 0);

  return rows.map((row) => ({
    name: row.name,
    quantity: row.quantity,
    revenue: row.revenue,
    average: row.quantity > 0 ? row.revenue / row.quantity : 0,
    share: sharePercent(row.revenue, totalRevenue),
    bar: maxRevenue > 0 ? Math.round((row.revenue / maxRevenue) * 100) : 0,
  }));
}

export function buildReportDocument({
  restaurantName,
  rangePreset,
  range,
  timezone,
  locale,
  currency,
  generatedAt = new Date(),
  summary,
  trend,
  categories,
  items,
  types,
  status,
}: {
  restaurantName: string;
  rangePreset: ReportRangePreset;
  range: DateRangeArgs;
  timezone: string;
  locale: string;
  currency: CurrencyConfig;
  generatedAt?: Date;
  summary: AnalyticsSummary;
  trend: TrendPoint[];
  categories: CategoryPerformance[];
  items: ItemPerformance[];
  types: TypeSlice[];
  status: StatusSlice[];
}): ReportDocument {
  const inclusiveTo = new Date(range.to.getTime() - 1);
  const periodLabel = `${formatDate(range.from, timezone, locale)} – ${formatDate(inclusiveTo, timezone, locale)}`;
  const dateStamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(generatedAt);

  return {
    restaurantName,
    rangePreset,
    rangeLabel: RANGE_PRESET_LABELS[rangePreset],
    periodLabel,
    generatedAt: formatDateTime(generatedAt, timezone, locale),
    timezone,
    currency,
    summary,
    trend,
    categories: rankPerformance(
      categories.map((row) => ({ name: row.category_name, quantity: row.quantity, revenue: row.revenue })),
      summary.revenue,
    ),
    items: rankPerformance(
      items.map((row) => ({ name: row.item_name, quantity: row.quantity, revenue: row.revenue })),
      summary.revenue,
    ),
    types,
    status,
    fileBase: `sales-report-${rangePreset}-${dateStamp}`,
  };
}

export function typeLabel(value: TypeSlice["order_type"]): string {
  return ORDER_TYPE_LABELS[value];
}

export function statusLabel(value: StatusSlice["status"]): string {
  return ORDER_STATUS_LABELS[value];
}
