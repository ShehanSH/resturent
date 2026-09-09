"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser Supabase client. Only ever carries the anon key, so every query it
 * makes is still subject to Row Level Security. Used for auth session handling
 * and Realtime subscriptions.
 */
export function createSupabaseBrowserClient() {
  browserClient ??= createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return browserClient;
}
