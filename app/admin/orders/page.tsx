import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderBoard } from "@/components/orders/order-board";
import { OrderBoardFilters } from "@/components/orders/order-board-filters";
import { ACTIVE_ORDER_STATUSES, TERMINAL_ORDER_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { parseBoardSearchParams, resolveBoardRange } from "@/lib/orders/board-filters";
import { listActiveOrders } from "@/lib/services/order.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { calendarDateInZone, startOfRestaurantDay } from "@/lib/timezone";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const settings = await getRestaurantSettings();
  const todayDate = calendarDateInZone(new Date(), settings.timezone);
  const parsed = parseBoardSearchParams({
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
    q: typeof params.q === "string" ? params.q : undefined,
    all: typeof params.all === "string" ? params.all : undefined,
  });
  const range = resolveBoardRange(parsed, settings.timezone, todayDate);
  const orders = await listActiveOrders([...ACTIVE_ORDER_STATUSES, ...TERMINAL_ORDER_STATUSES], {
    from: range.from,
    to: range.to,
    search: parsed.q,
  });

  const minDate = calendarDateInZone(startOfRestaurantDay(settings.timezone, -89), settings.timezone);
  const matching = parsed.q ? ` matching “${parsed.q}”` : "";
  const countLabel = `${orders.length} ${orders.length === 1 ? "order" : "orders"}`;
  let summary = `${countLabel} across all dates${matching}.`;
  if (!range.all && range.from && range.to) {
    const startLabel = formatDate(range.from, settings.timezone, settings.locale);
    const endLabel = formatDate(new Date(range.to.getTime() - 1), settings.timezone, settings.locale);
    const period = range.fromDate === range.toDate ? `on ${startLabel}` : `from ${startLabel} to ${endLabel}`;
    summary = `${countLabel} ${period}${matching}.`;
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Kitchen"
        title="Orders"
        description="Filter by all orders, a date range, customer name, or phone. Live status updates still appear without refresh."
      />
      <OrderBoardFilters
        all={range.all}
        fromDate={range.fromDate}
        toDate={range.toDate}
        search={parsed.q}
        todayDate={todayDate}
        minDate={minDate}
        summary={summary}
      />
      <OrderBoard
        initialOrders={orders}
        role="ADMIN"
        settings={settings}
        filter={{
          from: range.from?.toISOString(),
          to: range.to?.toISOString(),
          search: parsed.q,
        }}
      />
    </div>
  );
}
