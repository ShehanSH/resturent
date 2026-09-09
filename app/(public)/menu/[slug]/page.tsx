import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { FoodCard } from "@/components/public/food-card";
import { breadcrumbJsonLd, buildMetadata, categorySeoDescription, categorySeoTitle, seoPlaceName } from "@/lib/seo";
import { getCategoryBySlug, listMenuItems } from "@/lib/services/catalog.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { isSupabaseConfigured } from "@/lib/env";

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSupabaseConfigured) return { title: "Category" };
  const [settings, category] = await Promise.all([getRestaurantSettings(), getCategoryBySlug(slug)]);
  if (!category || !category.is_active) return { title: "Category" };
  return buildMetadata({
    title: category.seo_title || categorySeoTitle(category.name, settings.restaurant_name),
    description:
      category.seo_description ||
      categorySeoDescription({
        name: category.name,
        restaurantName: settings.restaurant_name,
        description: category.description,
        location: seoPlaceName(settings.restaurant_name, settings.address),
      }),
    path: `/menu/${category.slug}`,
    image: category.image_url,
    keywords: category.seo_keywords,
    settings,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSupabaseConfigured) notFound();

  const [settings, category, items] = await Promise.all([
    getRestaurantSettings(),
    getCategoryBySlug(slug),
    listMenuItems({ categorySlug: slug }),
  ]);

  if (!category || !category.is_active) notFound();

  return (
    <div className="page-wrap py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Menu", path: "/menu" },
              { name: category.name, path: `/menu/${category.slug}` },
            ]),
          ),
        }}
      />
      <p className="font-heading text-gold text-xs tracking-[0.28em] uppercase">Menu</p>
      <h1 className="font-heading mt-2 text-4xl tracking-wide text-primary uppercase">{category.name}</h1>
      {category.description ? <p className="text-muted-foreground mt-3 max-w-2xl">{category.description}</p> : null}
      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No dishes in this category yet." description="Check back soon or browse the full menu." />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <FoodCard key={item.id} item={item} settings={settings} from={`/menu/${category.slug}`} />
          ))}
        </div>
      )}
    </div>
  );
}
