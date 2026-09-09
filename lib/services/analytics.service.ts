import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderStatus, OrderType } from "@/types/database";
import type {
  AnalyticsSummary,
  CategoryPerformance,
  DateRangeArgs,
  HourlyPoint,
  ItemPerformance,
  StatusSlice,
  TrendPoint,
  TypeSlice,
} from "@/lib/services/analytics.types";

export type {
  AnalyticsSummary,
  CategoryPerformance,
  DateRangeArgs,
  HourlyPoint,
  ItemPerformance,
  StatusSlice,
  TrendPoint,
  TypeSlice,
} from "@/lib/services/analytics.types";

/**
 * Analytics reads.
 *
 * Every figure is produced by a SQL aggregate behind an authorization check.
 * The browser never receives raw order rows to total up itself.
 */

function toArgs({ from, to }: DateRangeArgs) {
  return { p_from: from.toISOString(), p_to: to.toISOString() };
}

export async function getAnalyticsSummary(range: DateRangeArgs): Promise<AnalyticsSummary> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("analytics_summary", toArgs(range));
  if (error) throw error;

  const summary = data as unknown as Partial<AnalyticsSummary> | null;

  return {
    total_orders: Number(summary?.total_orders ?? 0),
    revenue: Number(summary?.revenue ?? 0),
    pending_orders: Number(summary?.pending_orders ?? 0),
    active_orders: Number(summary?.active_orders ?? 0),
    completed_orders: Number(summary?.completed_orders ?? 0),
    cancelled_orders: Number(summary?.cancelled_orders ?? 0),
    pickup_orders: Number(summary?.pickup_orders ?? 0),
    delivery_orders: Number(summary?.delivery_orders ?? 0),
    items_sold: Number(summary?.items_sold ?? 0),
    average_order_value: Number(summary?.average_order_value ?? 0),
    uncollected_payments: Number(summary?.uncollected_payments ?? 0),
  };
}

export async function getOrdersByHour(range: DateRangeArgs): Promise<HourlyPoint[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("analytics_orders_by_hour", toArgs(range));
  if (error) throw error;

  return (data ?? []).map((row) => ({
    hour: Number(row.hour),
    orders: Number(row.orders),
    revenue: Number(row.revenue),
  }));
}

export async function getRevenueTrend(range: DateRangeArgs): Promise<TrendPoint[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("analytics_revenue_trend", toArgs(range));
  if (error) throw error;

  return (data ?? []).map((row) => ({
    day: String(row.day),
    orders: Number(row.orders),
    revenue: Number(row.revenue),
  }));
}

export async function getOrdersByCategory(range: DateRangeArgs): Promise<CategoryPerformance[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("analytics_orders_by_category", toArgs(range));
  if (error) throw error;

  return (data ?? []).map((row) => ({
    category_name: String(row.category_name),
    quantity: Number(row.quantity),
    revenue: Number(row.revenue),
  }));
}

export async function getTopItems(range: DateRangeArgs, limit = 10): Promise<ItemPerformance[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("analytics_top_items", {
    ...toArgs(range),
    p_limit: limit,
  });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    item_name: String(row.item_name),
    quantity: Number(row.quantity),
    revenue: Number(row.revenue),
  }));
}

export async function getStatusDistribution(range: DateRangeArgs): Promise<StatusSlice[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("analytics_status_distribution", toArgs(range));
  if (error) throw error;

  return (data ?? []).map((row) => ({
    status: row.status as OrderStatus,
    orders: Number(row.orders),
  }));
}

export async function getOrderTypeSplit(range: DateRangeArgs): Promise<TypeSlice[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("analytics_order_type_split", toArgs(range));
  if (error) throw error;

  return (data ?? []).map((row) => ({
    order_type: row.order_type as OrderType,
    orders: Number(row.orders),
    revenue: Number(row.revenue),
  }));
}

// ---------------------------------------------------------------------------
// Date range presets
// ---------------------------------------------------------------------------

export type RangePreset = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

export {
  RANGE_PRESET_LABELS,
  REPORT_RANGE_PRESETS,
  parseRangePreset,
  type ReportRangePreset,
} from "@/lib/reports/range";

/**
 * Resolves a preset into a half-open [from, to) interval anchored to the
 * restaurant's local midnight, so "today" means the restaurant's today rather
 * than the server's.
 */
export function resolveRange(
  preset: RangePreset,
  timezone: string,
  custom?: { from?: string; to?: string },
): DateRangeArgs {
  const startOfLocalDay = (offsetDays: number): Date => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const year = Number(parts.find((p) => p.type === "year")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);

    const localMidnightUtc = new Date(Date.UTC(year, month - 1, day + offsetDays, 0, 0, 0));
    // Correct for the zone's offset at that instant.
    const offsetMinutes = zoneOffsetMinutes(localMidnightUtc, timezone);
    return new Date(localMidnightUtc.getTime() - offsetMinutes * 60_000);
  };

  switch (preset) {
    case "today":
      return { from: startOfLocalDay(0), to: startOfLocalDay(1) };
    case "yesterday":
      return { from: startOfLocalDay(-1), to: startOfLocalDay(0) };
    case "7d":
      return { from: startOfLocalDay(-6), to: startOfLocalDay(1) };
    case "30d":
      return { from: startOfLocalDay(-29), to: startOfLocalDay(1) };
    case "90d":
      return { from: startOfLocalDay(-89), to: startOfLocalDay(1) };
    case "custom": {
      const from = custom?.from ? new Date(custom.from) : startOfLocalDay(-6);
      const to = custom?.to ? new Date(custom.to) : startOfLocalDay(1);
      return { from, to };
    }
  }
}

/** Minutes that `timezone` is ahead of UTC at the given instant. */
function zoneOffsetMinutes(instant: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  return (asUtc - instant.getTime()) / 60_000;
}
