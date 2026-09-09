import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";

import { AddToCartForm } from "@/components/public/add-to-cart-form";
import { FoodImage } from "@/components/public/food-image";
import { Price } from "@/components/public/price";
import { isSupabaseConfigured } from "@/lib/env";
import { safeMenuReturnPath } from "@/lib/public-paths";
import { getFoodItemBySlug } from "@/lib/services/catalog.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { breadcrumbJsonLd, buildMetadata, foodItemSeoDescription, foodItemSeoTitle, productJsonLd, seoPlaceName } from "@/lib/seo";

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSupabaseConfigured) return { title: "Dish" };
  const [settings, item] = await Promise.all([getRestaurantSettings(), getFoodItemBySlug(slug)]);
  if (!item || !item.is_active) return { title: "Dish" };
  return buildMetadata({
    title: item.seo_title || foodItemSeoTitle(item.name, settings.restaurant_name, item.category?.name),
    description:
      item.seo_description ||
      foodItemSeoDescription({
        name: item.name,
        restaurantName: settings.restaurant_name,
        shortDescription: item.short_description,
        description: item.description,
        categoryName: item.category?.name,
        location: seoPlaceName(settings.restaurant_name, settings.address),
      }),
    path: `/products/${item.slug}`,
    image: item.image_url,
    keywords: item.seo_keywords,
    settings,
  });
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  if (!isSupabaseConfigured) notFound();

  const [settings, item] = await Promise.all([getRestaurantSettings(), getFoodItemBySlug(slug)]);
  if (!item || !item.is_active) notFound();

  const fromParam = typeof query.from === "string" ? query.from : undefined;
  const returnTo = safeMenuReturnPath(
    fromParam,
    item.category ? `/menu/${item.category.slug}` : "/menu",
  );

  return (
    <div className="page-wrap py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(item, item.category, settings)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Menu", path: "/menu" },
              ...(item.category
                ? [{ name: item.category.name, path: `/menu/${item.category.slug}` }]
                : []),
              { name: item.name, path: `/products/${item.slug}` },
            ]),
          ),
        }}
      />

      <Link
        href={returnTo}
        className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-black/[0.03] hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to menu
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[color-mix(in_oklch,var(--cream),var(--primary)_8%)] shadow-[0_8px_30px_-12px_rgba(90,18,28,0.15)]">
          <FoodImage src={item.image_url} alt={item.name} sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div>
          {item.category ? (
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{item.category.name}</p>
          ) : null}
          <h1 className="font-heading mt-1 text-4xl tracking-wide text-primary uppercase">{item.name}</h1>
          <div className="mt-4 text-2xl">
            <Price price={Number(item.price)} discountPrice={item.discount_price} settings={settings} />
          </div>
          {item.preparation_time ? (
            <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/8">
                <Clock3 className="size-3.5 text-primary" />
              </span>
              About {item.preparation_time} minutes
            </p>
          ) : null}
          {item.description || item.short_description ? (
            <p className="mt-6 max-w-xl leading-relaxed text-foreground/80">{item.description || item.short_description}</p>
          ) : null}
          <div className="mt-8">
            <AddToCartForm item={item} settings={settings} returnTo={returnTo} />
          </div>
        </div>
      </div>
    </div>
  );
}
