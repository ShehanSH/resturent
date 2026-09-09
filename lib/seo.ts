import type { Metadata } from "next";

import { siteUrl } from "@/lib/env";
import { truncate, truncateAtWord } from "@/lib/format";
import type { CategoryRow, FoodItemRow, RestaurantSettingsRow } from "@/types/database";

/**
 * SEO helpers.
 *
 * Dish and category search titles are generated from the menu content so
 * administrators do not have to write them. Saving a dish or category always
 * refreshes these values from the latest name, category, and description.
 */

function collapseText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function firstFittingTitle(...candidates: string[]): string {
  const usable = candidates.filter((candidate) => candidate.trim().length > 0);
  const fit = usable.find((candidate) => candidate.length <= 60);
  return truncate(fit ?? usable.at(-1) ?? "", 60);
}

const COUNTRY_OR_REGION = new Set([
  "sri lanka",
  "srilanka",
  "india",
  "maldives",
  "south asia",
]);

/** Town or area used in search copy — never the country or a leftover city. */
export function seoPlaceName(restaurantName: string, address?: string | null): string | null {
  const fromName = restaurantName.match(/\bBeruwal[ae]\b/i)?.[0];
  if (fromName) return "Beruwala";

  const parts = (address ?? "")
    .split(",")
    .map((part) => part.replace(/\.$/, "").trim())
    .filter(Boolean)
    .reverse();

  for (const part of parts) {
    const normalized = part.toLowerCase().replace(/\s+/g, " ");
    if (COUNTRY_OR_REGION.has(normalized)) continue;
    if (/^colombo(\s+\d+)?$/.test(normalized)) continue;
    if (/^\d{4,6}$/.test(part)) continue;
    if (part.length >= 3 && part.length <= 28) return part;
  }

  const words = restaurantName.trim().split(/\s+/);
  const last = words.at(-1);
  if (words.length >= 2 && last && last.length >= 4 && !COUNTRY_OR_REGION.has(last.toLowerCase())) {
    return last;
  }
  return null;
}

function fitSeoDescription(blurb: string, cta: string, max = 155): string {
  const lead = collapseText(blurb);
  const combined = lead ? `${lead} ${cta}` : cta;
  if (combined.length <= max) return combined;
  if (cta.length <= max) return cta;
  return truncateAtWord(cta, max);
}

export function foodItemSeoTitle(
  name: string,
  restaurantName: string,
  categoryName?: string | null,
): string {
  const dish = collapseText(name);
  const restaurant = collapseText(restaurantName) || "Restaurant";
  if (!dish) return firstFittingTitle(`Order Online | ${restaurant}`, restaurant);

  return firstFittingTitle(
    `Order ${dish} Online | ${restaurant}`,
    categoryName ? `${dish} | ${collapseText(categoryName)} | ${restaurant}` : `${dish} | ${restaurant}`,
    `${dish} | ${restaurant}`,
  );
}

export function categorySeoTitle(name: string, restaurantName: string): string {
  const category = collapseText(name);
  const restaurant = collapseText(restaurantName) || "Restaurant";
  if (!category) return firstFittingTitle(`Menu | ${restaurant}`, restaurant);

  return firstFittingTitle(
    `Order ${category} Online | ${restaurant}`,
    `${category} Menu | ${restaurant}`,
    `${category} | ${restaurant}`,
  );
}

export function foodItemSeoDescription(input: {
  name: string;
  restaurantName: string;
  shortDescription?: string | null;
  description?: string | null;
  categoryName?: string | null;
  location?: string | null;
}): string {
  const dish = collapseText(input.name) || "this dish";
  const restaurant = collapseText(input.restaurantName) || "our restaurant";
  const place = input.location ? ` in ${input.location}` : "";
  const categoryBit = input.categoryName ? ` from our ${collapseText(input.categoryName)} menu` : "";
  const blurb = collapseText(input.shortDescription) || collapseText(input.description);
  const cta = `Order ${dish}${categoryBit} online from ${restaurant} for pickup or delivery${place}.`;
  return fitSeoDescription(blurb.length >= 40 ? blurb : "", cta);
}

export function categorySeoDescription(input: {
  name: string;
  restaurantName: string;
  description?: string | null;
  location?: string | null;
}): string {
  const category = collapseText(input.name) || "our menu";
  const restaurant = collapseText(input.restaurantName) || "our restaurant";
  const place = input.location ? ` in ${input.location}` : "";
  const blurb = collapseText(input.description);
  const cta = `Browse ${category} and order online from ${restaurant} for pickup or delivery${place}.`;
  return fitSeoDescription(blurb.length >= 40 ? blurb : "", cta);
}

export function catalogSeoKeywords(parts: Array<string | null | undefined>): string[] {
  const unique = new Set<string>();
  for (const part of [...parts, "order online", "food delivery", "takeaway"]) {
    const value = collapseText(part);
    if (value) unique.add(value);
  }
  return [...unique].slice(0, 15);
}

export function autoSeoTitle(name: string, restaurantName: string): string {
  return foodItemSeoTitle(name, restaurantName);
}

export function autoSeoDescription(source: string | null, fallback: string): string {
  const text = collapseText(source);
  return text.length >= 50 ? truncateAtWord(text, 155) : truncateAtWord(fallback, 155);
}

interface BuildMetadataArgs {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  keywords?: string[] | null;
  noIndex?: boolean;
  settings: RestaurantSettingsRow;
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  keywords,
  noIndex,
  settings,
}: BuildMetadataArgs): Metadata {
  const base = siteUrl();
  const canonical = `${base}${path}`;
  const ogImage = image ?? settings.hero_image_url ?? settings.logo_url ?? null;

  return {
    title,
    description,
    keywords: keywords ?? undefined,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: "website",
      siteName: settings.restaurant_name,
      title,
      description,
      url: canonical,
      locale: settings.locale.replace("-", "_"),
      images: ogImage ? [{ url: ogImage, alt: title }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Schema.org structured data
// ---------------------------------------------------------------------------

export function restaurantJsonLd(settings: RestaurantSettingsRow) {
  const base = siteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: settings.restaurant_name,
    description: settings.description ?? settings.tagline ?? undefined,
    url: base,
    telephone: settings.phone ?? undefined,
    email: settings.email ?? undefined,
    image: settings.hero_image_url ?? settings.logo_url ?? undefined,
    logo: settings.logo_url ?? undefined,
    priceRange: settings.currency_symbol,
    servesCuisine: "Sri Lankan",
    address: settings.address
      ? { "@type": "PostalAddress", streetAddress: settings.address }
      : undefined,
    openingHoursSpecification: (settings.business_hours ?? [])
      .filter((entry) => entry.is_open)
      .map((entry) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][entry.day],
        opens: entry.opens_at,
        closes: entry.closes_at,
      })),
    potentialAction: {
      "@type": "OrderAction",
      target: `${base}/menu`,
    },
  };
}

export function websiteJsonLd(settings: RestaurantSettingsRow) {
  const base = siteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.restaurant_name,
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/menu?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(
  item: FoodItemRow,
  category: Pick<CategoryRow, "name"> | null,
  settings: RestaurantSettingsRow,
) {
  const base = siteUrl();
  const price = item.discount_price ?? item.price;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.description ?? item.short_description ?? undefined,
    image: item.image_url ?? undefined,
    category: category?.name,
    url: `${base}/products/${item.slug}`,
    brand: { "@type": "Brand", name: settings.restaurant_name },
    offers: {
      "@type": "Offer",
      price: Number(price).toFixed(2),
      priceCurrency: settings.currency,
      availability: item.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${base}/products/${item.slug}`,
      seller: { "@type": "Restaurant", name: settings.restaurant_name },
    },
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  const base = siteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${base}${crumb.path}`,
    })),
  };
}
