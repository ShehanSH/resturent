import { productHref } from "@/lib/public-paths";
import type { FoodItemWithCategory } from "@/lib/services/catalog.service";
import type { RestaurantSettingsRow } from "@/types/database";

/** Local brand assets used until the restaurant uploads replacements in settings. */
export const BRAND_LOGO_SRC = "/brand/hbb-logo-hq.png";
export const BRAND_HERO_SRC = "/brand/hero-biryani.png";
export const BRAND_DELIVERY_SRC = "/brand/section-top-footer-image2-crop2.jpg";

export const BRAND_FALLBACK_NAME = "Hot Bread Beruwala";
export const BRAND_ADDRESS = "157/ EF Galle Rd, Beruwala";
export const BRAND_MAPS_URL =
  "https://www.google.com/maps?um=1&ie=UTF-8&fb=1&gl=lk&sa=X&geocode=KavOH_AWL-I6MQZP_gAEHNhA&daddr=157/+EF+Galle+Rd,+Beruwala";

/** Public address shown on the site. Stale city values like Colombo are ignored. */
export function restaurantAddress(address?: string | null): string {
  const value = address?.trim();
  if (value && /beruwala/i.test(value)) return value;
  return BRAND_ADDRESS;
}

export function restaurantMapsUrl(address?: string | null): string {
  const resolved = restaurantAddress(address);
  if (resolved === BRAND_ADDRESS || /beruwala/i.test(resolved)) return BRAND_MAPS_URL;
  return mapsSearchUrl(resolved);
}

export type PublicPromotion = {
  title: string;
  headline: string;
  description: string;
  badge: string | null;
  ctaLabel: string;
  href: string;
  imageUrl: string | null;
};

export function brandLogoSrc(logoUrl: string | null | undefined): string {
  const custom = logoUrl?.trim();
  if (
    custom &&
    !custom.includes("/brand/logo.png") &&
    !custom.includes("/brand/hbb-logo.png") &&
    !custom.includes("/brand/hbb-logo.jpg") &&
    !custom.includes("/brand/hbb-logo-mark.jpg") &&
    !custom.includes("/brand/hbb-logo-white.jpg")
  ) {
    return custom;
  }
  return BRAND_LOGO_SRC;
}

export function brandHeroSrc(heroUrl: string | null | undefined): string {
  const custom = heroUrl?.trim();
  if (custom && !custom.includes("/brand/hero.png") && !custom.includes("/brand/hero.jpg")) {
    return custom;
  }
  return BRAND_HERO_SRC;
}

export function announcementCopy(settings: RestaurantSettingsRow, isOpen: boolean): string {
  if (!settings.is_accepting_orders) {
    return "Online ordering is paused — you can still browse the menu";
  }
  if (isOpen) return "Freshly prepared every day · Pickup & delivery available";
  return "Today's kitchen is closed — browse the menu and order when we open";
}

export function mapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9) return null;
  return `https://wa.me/${digits}`;
}

export function categoryTagline(description: string | null): string {
  if (!description) return "Made fresh to order";
  const first = description.split(/[.!?]/)[0]?.trim();
  if (!first) return "Made fresh to order";
  return first.length > 42 ? `${first.slice(0, 41).trimEnd()}…` : first;
}

/**
 * Promotions are derived from live catalogue data so the UI is not hardcoded.
 * A dedicated promotions table can replace this later without changing callers.
 */
export function featuredPromotion(
  items: FoodItemWithCategory[],
  heroImageUrl: string | null,
): PublicPromotion | null {
  const special =
    items.find((item) => item.discount_price != null && Number(item.discount_price) > 0) ??
    items.find((item) => item.is_featured) ??
    items[0];

  if (!special) return null;

  return {
    title: "Today's special",
    headline: special.name,
    description: special.short_description || special.description || "Fresh from the kitchen, available now.",
    badge: special.discount_price ? "Offer" : special.is_featured ? "Popular" : null,
    ctaLabel: "Order now",
    href: productHref(special.slug, "/"),
    imageUrl: special.image_url || heroImageUrl,
  };
}

export function foodBadge(item: Pick<FoodItemWithCategory, "is_featured" | "discount_price">): string | null {
  if (item.discount_price != null && Number(item.discount_price) > 0) return "Offer";
  if (item.is_featured) return "Popular";
  return null;
}
