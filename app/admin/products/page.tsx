import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Star } from "lucide-react";

import { deleteFoodItemAction } from "@/app/actions/catalog";
import { AvailabilityToggle } from "@/components/admin/availability-toggle";
import { AdminDeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader, AdminPrimaryLink } from "@/components/admin/page-header";
import { ProductFilters } from "@/components/admin/product-filters";
import { DataTable, StatusBadge } from "@/components/admin/ui";
import { EmptyState } from "@/components/empty-state";
import { adminProductHref, adminProductsHref, resolveProductsCategory, withProductsFilter } from "@/lib/admin-paths";
import { formatMoney } from "@/lib/format";
import { listCategoriesForAdmin, listFoodItemsForAdmin } from "@/lib/services/catalog.service";
import { getRestaurantSettings } from "@/lib/services/settings.service";

export default async function AdminProductsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : undefined;
  const rawCategory = typeof params.category === "string" ? params.category : undefined;
  const [settings, categories] = await Promise.all([
    getRestaurantSettings(),
    listCategoriesForAdmin(),
  ]);
  const resolved = resolveProductsCategory(rawCategory, categories);
  if (resolved.redirectToSlug) {
    redirect(adminProductsHref({ q: search, category: resolved.categorySlug }));
  }

  const categoryId = resolved.categoryId;
  const filtered = Boolean(search || resolved.categorySlug);
  const filter = { q: search, category: resolved.categorySlug };
  const result =
    resolved.categorySlug && !categoryId
      ? { items: [], total: 0 }
      : await listFoodItemsForAdmin({ search, categoryId, page: 1, pageSize: 50 });
  const newHref = withProductsFilter("/admin/products/new", filter);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Menu"
        title="Food items"
        description="Manage dishes, prices, and availability for online ordering."
        action={<AdminPrimaryLink href={newHref}>Add Dish</AdminPrimaryLink>}
      />

      <ProductFilters search={search} categorySlug={resolved.categorySlug} categories={categories} />

      {result.items.length === 0 ? (
        <EmptyState
          title={filtered ? "No dishes found" : "No dishes yet"}
          description={
            filtered
              ? "There are no dishes matching your search or filters."
              : "Add your first dish to start taking orders."
          }
          action={<AdminPrimaryLink href={newHref}>Add Dish</AdminPrimaryLink>}
        />
      ) : (
        <DataTable>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Food item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium text-foreground">{item.name}</td>
                  <td className="text-muted-foreground">{item.category?.name ?? "—"}</td>
                  <td className="font-medium">{formatMoney(item.price, settings)}</td>
                  <td>
                    <StatusBadge variant={item.is_available ? "success" : "warning"}>
                      {item.is_available ? "Available" : "Unavailable"}
                    </StatusBadge>
                  </td>
                  <td>
                    {item.is_featured ? (
                      <StatusBadge variant="brand" dot={false}>
                        <Star className="size-3 fill-current" aria-hidden />
                        Featured
                      </StatusBadge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={adminProductHref(item.slug, filter)}
                        className="btn-admin-outline h-9 px-3 text-xs"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Link>
                      <AvailabilityToggle id={item.id} available={item.is_available} />
                      <AdminDeleteButton
                        id={item.id}
                        label="Dish"
                        name={item.name}
                        description="It will be removed from the menu."
                        action={deleteFoodItemAction}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}
    </div>
  );
}
