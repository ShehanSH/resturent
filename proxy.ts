import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeStaffReturnPath } from "@/lib/auth/paths";

/**
 * Proxy (formerly "middleware" before Next.js 16).
 *
 * Two jobs, both deliberately cheap:
 *
 *   1. Refresh the Supabase auth session cookie on every request so server
 *      components never see an expired token.
 *   2. An *optimistic* redirect away from staff areas for signed-out visitors.
 *
 * This is not the authorization boundary. Role checks are enforced again in
 * every protected layout and, ultimately, by Row Level Security in Postgres.
 */

const PROTECTED_PREFIXES = ["/admin", "/cashier", "/delivery"] as const;

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Must be getUser(), not getSession(): it revalidates the JWT with Supabase
  // rather than trusting a cookie that the browser could have tampered with.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.search = "";
    const nextPath = safeStaffReturnPath(`${pathname}${request.nextUrl.search}`, "");
    if (nextPath) loginUrl.searchParams.set("redirectTo", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/auth/login") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/auth/redirect";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static assets. Keeping images and
     * fonts out of the proxy avoids a pointless auth round-trip per asset.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
