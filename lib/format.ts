/**
 * Presentation helpers. Currency and locale come from restaurant settings so
 * nothing about the money format is hardcoded to one country.
 */

export interface CurrencyConfig {
  currency: string;
  currency_symbol: string;
  locale: string;
}

/** Converts a 24-hour "HH:mm" restaurant setting into a readable clock time. */
export function formatClock(value: string, locale = "en-LK"): string {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const date = new Date(1970, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatMoney(amount: number | string | null | undefined, config: CurrencyConfig): string {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(value)) return `${config.currency_symbol} 0.00`;

  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `${config.currency_symbol} ${formatted}`;
}

/** Extra cost shown on size/topping choices. Zero is "Included". */
export function formatPriceAdjustment(
  amount: number | string | null | undefined,
  config: CurrencyConfig,
): string {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(value) || value === 0) return "Included";
  const formatted = formatMoney(Math.abs(value), config);
  return value > 0 ? `+${formatted}` : `−${formatted}`;
}

export function formatNumber(value: number, locale = "en-LK"): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDateTime(
  value: string | Date | null | undefined,
  timezone: string,
  locale = "en-LK",
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export function formatTime(
  value: string | Date | null | undefined,
  timezone: string,
  locale = "en-LK",
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

export function formatDate(
  value: string | Date | null | undefined,
  timezone: string,
  locale = "en-LK",
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: timezone,
  }).format(date);
}

/** "5 minutes ago", "in 12 minutes" — used on the live order boards. */
export function formatRelative(value: string | Date | null | undefined, locale = "en-LK"): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const absolute = Math.abs(diffSeconds);
  if (absolute < 60) return formatter.format(diffSeconds, "second");
  if (absolute < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (absolute < 86400) return formatter.format(Math.round(diffSeconds / 3600), "hour");
  return formatter.format(Math.round(diffSeconds / 86400), "day");
}

/** Turns "Chicken Cheese Burger" into "chicken-cheese-burger". */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1).trimEnd()}…`;
}

/** Truncate on a word boundary so search copy never ends as "Sri Lan…". */
export function truncateAtWord(value: string, length: number): string {
  if (value.length <= length) return value;
  const slice = value.slice(0, Math.max(1, length - 1));
  const breakAt = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("\n"));
  const cut = breakAt >= Math.floor(length * 0.55) ? slice.slice(0, breakAt) : slice;
  return `${cut.trimEnd()}…`;
}

/** Initials for the staff avatar fallback. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
