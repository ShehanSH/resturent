import Link from "next/link";
import { Pencil, Star } from "lucide-react";

import { deleteCategoryAction } from "@/app/actions/catalog";
import { CategoryToggle } from "@/components/admin/category-toggle";
import { AdminDeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader, AdminPrimaryLink } from "@/components/admin/page-header";
import { DataTable, StatusBadge } from "@/components/admin/ui";
import { EmptyState } from "@/components/empty-state";
import { listCategoriesForAdmin } from "@/lib/services/catalog.service";

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesForAdmin();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Menu"
        title="Categories"
        description="Organize dishes into sections customers browse on the menu."
        action={<AdminPrimaryLink href="/admin/categories/new">Add Category</AdminPrimaryLink>}
      />
      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Add burgers, kottu, drinks, and the rest of the menu."
          action={<AdminPrimaryLink href="/admin/categories/new">Add Category</AdminPrimaryLink>}
        />
      ) : (
        <DataTable>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Order</th>
                <th>Dishes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="font-medium text-foreground">{category.name}</td>
                  <td>
                    <StatusBadge variant={category.is_active ? "success" : "neutral"}>
                      {category.is_active ? "Active" : "Hidden"}
                    </StatusBadge>
                  </td>
                  <td>
                    {category.is_featured ? (
                      <StatusBadge variant="brand" dot={false}>
                        <Star className="size-3 fill-current" aria-hidden />
                        Featured
                      </StatusBadge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="text-muted-foreground">{category.display_order}</td>
                  <td>{category.food_count}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/categories/${category.id}`} className="btn-admin-outline h-9 px-3 text-xs">
                        <Pencil className="size-3.5" />
                        Edit
                      </Link>
                      <CategoryToggle id={category.id} active={category.is_active} />
                      <AdminDeleteButton
                        id={category.id}
                        label="Category"
                        name={category.name}
                        description={
                          category.food_count > 0
                            ? `Its ${category.food_count} ${category.food_count === 1 ? "dish" : "dishes"} will also be removed.`
                            : "It will be removed from the menu."
                        }
                        action={deleteCategoryAction}
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
