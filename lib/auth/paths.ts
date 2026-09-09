/**
 * Staff post-login redirects. `redirectTo` is only accepted when it points at
 * a staff area, so `?redirectTo=//evil.example` cannot bounce a signed-in user
 * off-site.
 */

const STAFF_PATH = /^\/(admin|cashier|delivery)(\/[\w\-./]*)?$/;

export function safeStaffReturnPath(value: unknown, fallback: string): string {
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

  const path = (decoded.split("?")[0] ?? "").split("#")[0] ?? "";
  if (!STAFF_PATH.test(path)) return fallback;
  return path;
}
