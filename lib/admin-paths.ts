import { slugify } from "@/lib/format";

/** Safe list URL for the admin food items page. */
export function adminProductsHref(input?: { q?: string | null; category?: string | null }) {
  const params = new URLSearchParams();
  const q = input?.q?.trim();
  const category = input?.category?.trim();
  if (q) params.set("q", q);
  if (category && category !== "all") params.set("category", category);
  const query = params.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}

/**
 * Admin product filters keep the category slug in the URL (like the public
 * menu). Old UUID query params still resolve, and callers can redirect them.
 */
export function resolveProductsCategory(
  raw: string | null | undefined,
  categories: { id: string; slug: string }[],
): { categoryId?: string; categorySlug?: string; redirectToSlug: boolean } {
  const value = raw?.trim();
  if (!value || value === "all") return { redirectToSlug: false };

  const match = categories.find((category) => category.slug === value || category.id === value);
  if (!match) return { categorySlug: value, redirectToSlug: false };

  return {
    categoryId: match.id,
    categorySlug: match.slug,
    redirectToSlug: value !== match.slug,
  };
}

export function withProductsFilter(
  path: string,
  input?: { q?: string | null; category?: string | null },
) {
  const list = adminProductsHref(input);
  const query = list.includes("?") ? list.slice(list.indexOf("?") + 1) : "";
  return query ? `${path}?${query}` : path;
}

export function productsReturnTo(
  searchParams: Record<string, string | string[] | undefined>,
) {
  return adminProductsHref({
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    category: typeof searchParams.category === "string" ? searchParams.category : undefined,
  });
}

export function adminCategoryHref(slug: string) {
  return `/admin/categories/${slug}`;
}

export function adminProductHref(
  slug: string,
  filter?: { q?: string | null; category?: string | null },
) {
  return withProductsFilter(`/admin/products/${slug}`, filter);
}

export function adminOptionHref(name: string, id: string) {
  const slug = slugify(name);
  return `/admin/options/${slug && slug !== "new" ? slug : id}`;
}
