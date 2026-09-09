import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/category-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data }, settings] = await Promise.all([
    supabase.from("categories").select("*").eq("id", id).maybeSingle(),
    getRestaurantSettings(),
  ]);
  if (!data) notFound();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Menu"
        title="Edit category"
        description={`Update “${data.name}” and how it appears on the menu.`}
        backHref="/admin/categories"
      />
      <CategoryForm
        category={data}
        restaurantName={settings.restaurant_name}
        restaurantAddress={settings.address}
      />
    </div>
  );
}
