import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { FoodCard } from "@/components/public/food-card";
import { MenuBrowser } from "@/components/public/menu-filters";
import { isSupabaseConfigured } from "@/lib/env";
import { currentMenuPath } from "@/lib/public-paths";
import { listMenuItems, listPublicCategories } from "@/lib/services/catalog.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  if (!isSupabaseConfigured) return { title: "Menu" };
  const settings = await getRestaurantSettings();
  return buildMetadata({
    title: `Menu | ${settings.restaurant_name}`,
    description: `Browse the full ${settings.restaurant_name} menu. Filter by category and add dishes to your cart.`,
    path: "/menu",
    settings,
  });
}

export default async function MenuPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const sort = typeof params.sort === "string" ? params.sort : "popular";
  const category = typeof params.category === "string" ? params.category : undefined;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <EmptyState title="Menu unavailable" description="Connect Supabase to load dishes." />
      </div>
    );
  }

  const settings = await getRestaurantSettings();
  const [categories, items] = await Promise.all([
    listPublicCategories(),
    listMenuItems({
      categorySlug: category,
      search: q,
      sort: sort === "price-asc" || sort === "price-desc" || sort === "name" ? sort : "popular",
    }),
  ]);

  return (
    <div className="page-wrap py-8 sm:py-10">
      <header className="max-w-2xl">
        <p className="font-script text-3xl text-gold">Today&apos;s kitchen</p>
        <h1 className="font-heading mt-1 text-4xl tracking-wide text-primary uppercase sm:text-5xl">Menu</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed sm:text-base">
          Search by name, tap a category, or sort by price. Add a dish in one tap — prices are confirmed at
          checkout.
        </p>
      </header>
      <MenuBrowser categories={categories} resultCount={items.length}>
        {items.length === 0 ? (
          <EmptyState
            title="No dishes match that search."
            description="Try another category, clear the search, or browse the full menu."
            action={
              <Link href="/menu" className="btn-order-outline">
                View all dishes
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <FoodCard
                key={item.id}
                item={item}
                settings={settings}
                index={index}
                from={currentMenuPath(params)}
              />
            ))}
          </div>
        )}
      </MenuBrowser>
    </div>
  );
}
