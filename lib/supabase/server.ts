import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Request-scoped Supabase client that carries the signed-in user's session.
 *
 * It uses the anon key, so Row Level Security applies to everything it reads or
 * writes. This is the client that all staff-facing server code should use: even
 * if an authorization check were missed in application code, the database would
 * still refuse the query.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot write cookies. Session refresh is handled
            // in proxy.ts, so it is safe to ignore this here.
          }
        },
      },
    },
  );
}
