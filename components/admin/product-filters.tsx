"use client";

import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";

import { SearchField } from "@/components/admin/search-field";
import { AdminSelect } from "@/components/admin/select-field";
import { adminProductsHref } from "@/lib/admin-paths";

export function ProductFilters({
  search,
  categoryId,
  categories,
}: {
  search?: string;
  categoryId?: string;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();

  function navigate(next: { q?: string; category?: string }) {
    const href = adminProductsHref({
      q: next.q !== undefined ? next.q : search,
      category: next.category !== undefined ? next.category : categoryId,
    });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === href) return;
    router.push(href);
  }

  return (
    <div className="admin-toolbar" role="search">
      <SearchField
        name="q"
        defaultValue={search}
        placeholder="Search dishes..."
        onSearch={(q) => navigate({ q })}
      />
      <AdminSelect
        id="category-filter"
        aria-label="Filter by category"
        value={categoryId || "all"}
        className="sm:max-w-64"
        icon={<Filter className="size-4 text-muted-foreground" aria-hidden />}
        onValueChange={(value) => navigate({ category: value })}
        options={[
          { value: "all", label: "All categories" },
          ...categories.map((category) => ({ value: category.id, label: category.name })),
        ]}
      />
    </div>
  );
}
