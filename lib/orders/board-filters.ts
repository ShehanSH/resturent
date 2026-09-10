import { parseIsoDate, rangeForCalendarDate, startOfRestaurantDay } from "@/lib/timezone";

export function adminOrdersHref(input?: {
  from?: string | null;
  to?: string | null;
  q?: string | null;
  today?: string;
  all?: boolean;
}) {
  const params = new URLSearchParams();
  const q = input?.q?.trim();
  if (input?.all) {
    params.set("all", "1");
    if (q) params.set("q", q);
    const query = params.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders?all=1";
  }

  const today = input?.today;
  let from = parseIsoDate(input?.from ?? undefined);
  let to = parseIsoDate(input?.to ?? undefined);
  if (from && to && from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  const defaultToday = Boolean(today) && (!from || from === today) && (!to || to === today);
  if (!defaultToday && from) params.set("from", from);
  if (!defaultToday && to && to !== from) params.set("to", to);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export function parseBoardSearchParams(params: {
  from?: string;
  to?: string;
  q?: string;
  all?: string;
}): { from?: string; to?: string; q?: string; all: boolean } {
  return {
    from: parseIsoDate(params.from),
    to: parseIsoDate(params.to),
    q: params.q?.trim() || undefined,
    all: params.all === "1" || params.all === "true",
  };
}

export function resolveBoardRange(
  filter: { from?: string; to?: string; all?: boolean },
  timezone: string,
  todayDate: string,
): { all: boolean; fromDate: string; toDate: string; from?: Date; to?: Date } {
  if (filter.all) {
    return { all: true, fromDate: "", toDate: "" };
  }

  let fromDate = filter.from ?? todayDate;
  let toDate = filter.to ?? filter.from ?? todayDate;
  if (fromDate > toDate) {
    const swap = fromDate;
    fromDate = toDate;
    toDate = swap;
  }

  const start = rangeForCalendarDate(timezone, fromDate);
  const end = rangeForCalendarDate(timezone, toDate);
  if (!start || !end) {
    return {
      all: false,
      fromDate: todayDate,
      toDate: todayDate,
      from: startOfRestaurantDay(timezone, 0),
      to: startOfRestaurantDay(timezone, 1),
    };
  }

  return { all: false, fromDate, toDate, from: start.from, to: end.to };
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function orderMatchesSearch(
  order: { order_number: string; customer_name: string; customer_phone: string },
  search?: string,
): boolean {
  const term = search?.trim().toLowerCase();
  if (!term) return true;
  if (order.order_number.toLowerCase().includes(term)) return true;
  if (order.customer_name.toLowerCase().includes(term)) return true;
  if (order.customer_phone.toLowerCase().includes(term)) return true;
  const needle = digitsOnly(term);
  if (needle.length >= 3) {
    const haystack = digitsOnly(order.customer_phone);
    if (haystack.includes(needle) || haystack.endsWith(needle.slice(-9))) return true;
  }
  return false;
}

export function orderMatchesBoardWindow(
  createdAt: string,
  range?: { from?: Date; to?: Date },
): boolean {
  if (!range?.from && !range?.to) return true;
  const time = new Date(createdAt).getTime();
  if (Number.isNaN(time)) return false;
  if (range.from && time < range.from.getTime()) return false;
  if (range.to && time >= range.to.getTime()) return false;
  return true;
}

/** Sanitize a search string before interpolating into a PostgREST `or` filter. */
export function boardSearchClause(search: string): string | null {
  const term = search.replace(/[(),*%_]/g, " ").trim();
  if (!term) return null;
  const clauses = [
    `order_number.ilike.%${term}%`,
    `customer_name.ilike.%${term}%`,
    `customer_phone.ilike.%${term}%`,
  ];
  const digits = digitsOnly(term);
  if (digits.length >= 7) {
    const last9 = digits.slice(-9);
    if (last9 !== term) clauses.push(`customer_phone.ilike.%${last9}%`);
  }
  return clauses.join(",");
}
