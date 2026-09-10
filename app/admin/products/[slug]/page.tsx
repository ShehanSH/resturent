import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { FoodItemForm } from "@/components/admin/food-item-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { adminProductHref, productsReturnTo, resolveProductsCategory } from "@/lib/admin-paths";
import { getFoodItemForAdmin, listCategoriesForAdmin, listOptionGroups } from "@/lib/services/catalog.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { isUuid } from "@/lib/validations/common";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getFoodItemForAdmin(slug);
  return {
    title: item ? `Edit ${item.name}` : "Edit dish",
    robots: { index: false, follow: false },
  };
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const [item, categories, groups, settings] = await Promise.all([
    getFoodItemForAdmin(slug),
    listCategoriesForAdmin(),
    listOptionGroups(),
    getRestaurantSettings(),
  ]);
  if (!item) notFound();

  const search = typeof query.q === "string" ? query.q : undefined;
  const rawCategory = typeof query.category === "string" ? query.category : undefined;
  const resolved = resolveProductsCategory(rawCategory, categories);
  const filter = { q: search, category: resolved.categorySlug };
  if ((isUuid(slug) && item.slug) || resolved.redirectToSlug) {
    redirect(adminProductHref(item.slug, filter));
  }
  const returnTo = productsReturnTo({ q: search, category: resolved.categorySlug });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Menu"
        title="Edit dish"
        description={`Update “${item.name}” pricing, options, and availability.`}
        backHref={returnTo}
      />
      <FoodItemForm
        item={item}
        categories={categories}
        optionGroupIds={item.option_group_ids}
        optionGroups={groups}
        restaurantName={settings.restaurant_name}
        restaurantAddress={settings.address}
        returnTo={returnTo}
        settings={settings}
      />
    </div>
  );
}
