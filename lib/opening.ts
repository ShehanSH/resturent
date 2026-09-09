import type { BusinessHourEntry, RestaurantSettingsRow } from "@/types/database";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function dayName(day: number): string {
  return DAY_NAMES[day] ?? "Unknown";
}

export interface OpeningState {
  isOpen: boolean;
  /** "Open now" / "Closed — opens Monday at 11:00" */
  label: string;
  nextOpensAt: string | null;
}

/** Minutes since midnight, in the restaurant's own timezone. */
function localMinutes(date: Date, timezone: string): { day: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);

  return { day: dayIndex === -1 ? 0 : dayIndex, minutes: hour * 60 + minute };
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/**
 * Mirrors `public.is_restaurant_open()` so the public site can show an accurate
 * badge without a database round-trip. The database remains authoritative when
 * an order is actually placed.
 */
export function getOpeningState(settings: RestaurantSettingsRow, now = new Date()): OpeningState {
  if (!settings.is_accepting_orders) {
    return { isOpen: false, label: "Temporarily not accepting orders", nextOpensAt: null };
  }

  const hours = settings.business_hours ?? [];
  if (hours.length === 0) {
    return { isOpen: true, label: "Open now", nextOpensAt: null };
  }

  const { day, minutes } = localMinutes(now, settings.timezone);
  const today = hours.find((entry) => entry.day === day);

  if (today?.is_open) {
    const opens = toMinutes(today.opens_at);
    const closes = toMinutes(today.closes_at);

    const isOpen = closes <= opens ? minutes >= opens || minutes <= closes : minutes >= opens && minutes <= closes;

    if (isOpen) {
      return { isOpen: true, label: `Open now until ${today.closes_at}`, nextOpensAt: null };
    }

    if (minutes < opens) {
      return {
        isOpen: false,
        label: `Closed — opens today at ${today.opens_at}`,
        nextOpensAt: today.opens_at,
      };
    }
  }

  const next = findNextOpening(hours, day);
  return {
    isOpen: false,
    label: next ? `Closed — opens ${next.dayLabel} at ${next.opens_at}` : "Closed",
    nextOpensAt: next?.opens_at ?? null,
  };
}

function findNextOpening(
  hours: BusinessHourEntry[],
  fromDay: number,
): { dayLabel: string; opens_at: string } | null {
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (fromDay + offset) % 7;
    const entry = hours.find((h) => h.day === day && h.is_open);
    if (entry) {
      return {
        dayLabel: offset === 1 ? "tomorrow" : dayName(day),
        opens_at: entry.opens_at,
      };
    }
  }
  return null;
}

/** Whether checkout should be blocked right now. */
export function canAcceptOrders(settings: RestaurantSettingsRow, now = new Date()): boolean {
  if (!settings.is_accepting_orders) return false;
  if (settings.allow_orders_when_closed) return true;
  return getOpeningState(settings, now).isOpen;
}
