import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { CategoryForm } from "@/components/admin/category-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { adminCategoryHref } from "@/lib/admin-paths";
import { getCategoryForAdmin } from "@/lib/services/catalog.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { isUuid } from "@/lib/validations/common";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryForAdmin(slug);
  return {
    title: category ? `Edit ${category.name}` : "Edit category",
    robots: { index: false, follow: false },
  };
}

export default async function EditCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, settings] = await Promise.all([getCategoryForAdmin(slug), getRestaurantSettings()]);
  if (!category) notFound();
  if (isUuid(slug) && category.slug) {
    redirect(adminCategoryHref(category.slug));
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Menu"
        title="Edit category"
        description={`Update “${category.name}” and how it appears on the menu.`}
        backHref="/admin/categories"
      />
      <CategoryForm
        category={category}
        restaurantName={settings.restaurant_name}
        restaurantAddress={settings.address}
      />
    </div>
  );
}
