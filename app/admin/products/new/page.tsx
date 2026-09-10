import { redirect } from "next/navigation";

import { FoodItemForm } from "@/components/admin/food-item-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { productsReturnTo, resolveProductsCategory, withProductsFilter } from "@/lib/admin-paths";
import { listCategoriesForAdmin, listOptionGroups } from "@/lib/services/catalog.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const [categories, groups, settings] = await Promise.all([
    listCategoriesForAdmin(),
    listOptionGroups(),
    getRestaurantSettings(),
  ]);
  const search = typeof query.q === "string" ? query.q : undefined;
  const resolved = resolveProductsCategory(
    typeof query.category === "string" ? query.category : undefined,
    categories,
  );
  if (resolved.redirectToSlug) {
    redirect(withProductsFilter("/admin/products/new", { q: search, category: resolved.categorySlug }));
  }
  const returnTo = productsReturnTo({ q: search, category: resolved.categorySlug });
  return (
    <div>
      <AdminPageHeader
        eyebrow="Menu"
        title="New dish"
        description="Add a dish customers can order for pickup or delivery."
        backHref={returnTo}
      />
      <FoodItemForm
        categories={categories}
        optionGroups={groups}
        restaurantName={settings.restaurant_name}
        restaurantAddress={settings.address}
        returnTo={returnTo}
        settings={settings}
      />
    </div>
  );
}
