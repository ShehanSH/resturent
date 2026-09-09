import { FoodItemForm } from "@/components/admin/food-item-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { productsReturnTo } from "@/lib/admin-paths";
import { listCategoriesForAdmin, listOptionGroups } from "@/lib/services/catalog.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const returnTo = productsReturnTo(await searchParams);
  const [categories, groups, settings] = await Promise.all([
    listCategoriesForAdmin(),
    listOptionGroups(),
    getRestaurantSettings(),
  ]);
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
