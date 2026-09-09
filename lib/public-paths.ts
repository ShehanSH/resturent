/**
 * Public menu/product URLs. `from` is only accepted when it points back at the
 * storefront menu (or home), so a tampered query cannot bounce a shopper onto
 * checkout, admin, or an external site.
 */

const MENU_PATH = /^\/menu(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/;

export function currentMenuPath(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const key of ["category", "q", "sort"] as const) {
    const value = searchParams[key];
    if (typeof value === "string" && value.trim()) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/menu?${query}` : "/menu";
}

export function productHref(slug: string, from?: string): string {
  const path = `/products/${slug}`;
  if (!from) return path;
  return `${path}?from=${encodeURIComponent(from)}`;
}

export function safeMenuReturnPath(value: unknown, fallback = "/menu"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 180) return fallback;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("://") || decoded.includes("\\")) {
    return fallback;
  }

  const [rawPath, rawQuery] = decoded.split("?");
  const path = rawPath ?? "";
  if (path !== "/" && !MENU_PATH.test(path)) return fallback;

  if (!rawQuery) return path;

  const params = new URLSearchParams(rawQuery);
  const allowed = new URLSearchParams();
  for (const key of ["category", "q", "sort"]) {
    const next = params.get(key);
    if (next) allowed.set(key, next);
  }
  const query = allowed.toString();
  return query ? `${path}?${query}` : path;
}
