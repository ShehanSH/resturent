import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service-role Supabase client. **Bypasses Row Level Security entirely.**
 *
 * Reserved for the small number of operations that legitimately have no user
 * session behind them:
 *
 *   - guest checkout (calls the `create_order` function)
 *   - writing SMS logs and rate-limit hits
 *   - the one-off first-admin bootstrap script
 *
 * Never import this from a Client Component, and never hand its results
 * straight back to an unauthenticated caller without filtering them first.
 */
export function createSupabaseAdminClient() {
  adminClient ??= createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
  return adminClient;
}
