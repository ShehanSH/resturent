import { notFound } from "next/navigation";

import { FoodItemForm } from "@/components/admin/food-item-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { productsReturnTo } from "@/lib/admin-paths";
import { getFoodItemForAdmin, listCategoriesForAdmin, listOptionGroups } from "@/lib/services/catalog.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const returnTo = productsReturnTo(await searchParams);
  const [item, categories, groups, settings] = await Promise.all([
    getFoodItemForAdmin(id),
    listCategoriesForAdmin(),
    listOptionGroups(),
    getRestaurantSettings(),
  ]);
  if (!item) notFound();

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
