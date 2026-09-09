import { CategoryForm } from "@/components/admin/category-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getRestaurantSettings } from "@/lib/services/settings.service";

export default async function NewCategoryPage() {
  const settings = await getRestaurantSettings();
  return (
    <div>
      <AdminPageHeader
        eyebrow="Menu"
        title="New category"
        description="Create a section for the online menu, like Burgers or Desserts."
        backHref="/admin/categories"
      />
      <CategoryForm restaurantName={settings.restaurant_name} restaurantAddress={settings.address} />
    </div>
  );
}
