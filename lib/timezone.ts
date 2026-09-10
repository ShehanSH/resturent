/**
 * Restaurant-local calendar days. "Today" on the kitchen board means midnight
 * in the restaurant timezone, not the server's.
 */

export function calendarDateInZone(instant: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Minutes that `timezone` is ahead of UTC at the given instant. */
export function zoneOffsetMinutes(instant: Date, timezone: string): number {
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

/** Local midnight for an explicit Y-M-D in `timezone`. `day` may overflow the month. */
export function startOfZonedDay(timezone: string, year: number, month: number, day: number): Date {
  const localMidnightUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offsetMinutes = zoneOffsetMinutes(localMidnightUtc, timezone);
  return new Date(localMidnightUtc.getTime() - offsetMinutes * 60_000);
}

export function startOfRestaurantDay(timezone: string, offsetDays = 0, now = new Date()): Date {
  const [year, month, day] = calendarDateInZone(now, timezone)
    .split("-")
    .map(Number) as [number, number, number];
  return startOfZonedDay(timezone, year, month, day + offsetDays);
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !ISO_DATE.test(trimmed)) return undefined;
  return trimmed;
}

/** Half-open [from, to) for one calendar date in the restaurant timezone. */
export function rangeForCalendarDate(
  timezone: string,
  isoDate: string,
): { from: Date; to: Date } | null {
  const match = ISO_DATE.exec(isoDate.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return {
    from: startOfZonedDay(timezone, year, month, day),
    to: startOfZonedDay(timezone, year, month, day + 1),
  };
}
