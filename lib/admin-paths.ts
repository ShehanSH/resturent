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
