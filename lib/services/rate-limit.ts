import "server-only";

import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Rate limiting for the public order endpoint.
 *
 * Backed by a Postgres table rather than in-memory state, because Vercel runs
 * the app across many short-lived serverless instances where a module-level Map
 * would be useless. Limits are intentionally generous: a family ordering twice
 * in an evening must never be blocked.
 *
 * Fails **open** — if the limiter itself errors, the order proceeds. Losing a
 * real order is worse than allowing an occasional extra request.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds = 3600,
): Promise<RateLimitResult> {
  if (!identifier) return { allowed: true, remaining: limit };

  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  try {
    const { count, error } = await admin
      .from("rate_limit_hits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .eq("identifier", identifier)
      .gte("created_at", since);

    if (error) throw error;

    const used = count ?? 0;
    if (used >= limit) {
      logger.warn("ratelimit.blocked", { bucket, used, limit });
      return { allowed: false, remaining: 0 };
    }

    await admin.from("rate_limit_hits").insert({ bucket, identifier });

    return { allowed: true, remaining: Math.max(limit - used - 1, 0) };
  } catch (error) {
    logger.error("ratelimit.unavailable", {
      bucket,
      message: error instanceof Error ? error.message : String(error),
    });
    return { allowed: true, remaining: limit };
  }
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Housekeeping: drop hits outside the widest window we care about. */
export async function pruneRateLimitHits(olderThanHours = 24): Promise<void> {
  const admin = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - olderThanHours * 3600 * 1000).toISOString();
  await admin.from("rate_limit_hits").delete().lt("created_at", cutoff);
}
