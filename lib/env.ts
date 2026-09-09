import { z } from "zod";

/**
 * Environment configuration.
 *
 * Public values are inlined into the browser bundle at build time, so they are
 * referenced through literal `process.env.NEXT_PUBLIC_*` expressions. Secrets
 * are read lazily through `serverEnv()` and are unreachable from client code.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

export const isSupabaseConfigured = parsedPublic.success;

/**
 * Placeholder values so the Next.js compiler can evaluate this module before
 * `.env.local` exists. Runtime pages check `isSupabaseConfigured` first.
 */
const PLACEHOLDER_PUBLIC = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-placeholder-key-not-real",
  NEXT_PUBLIC_SITE_URL: undefined as string | undefined,
};

export const publicEnv = parsedPublic.success ? parsedPublic.data : PLACEHOLDER_PUBLIC;

export function siteUrl(): string {
  if (publicEnv.NEXT_PUBLIC_SITE_URL) {
    return publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
}

/** Blank `.env` values (`SMS_API_URL=`) must not fail checkout. */
function blankToUndefined(value: unknown): unknown {
  if (value == null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SMS_PROVIDER: z.preprocess(
    blankToUndefined,
    z.enum(["generic", "console", "disabled"]).default("disabled"),
  ),
  SMS_API_URL: z.preprocess(blankToUndefined, z.url().optional()),
  SMS_API_KEY: z.preprocess(blankToUndefined, z.string().optional()),
  SMS_API_SECRET: z.preprocess(blankToUndefined, z.string().optional()),
  SMS_SENDER_ID: z.preprocess(blankToUndefined, z.string().optional()),
  SMS_DEFAULT_COUNTRY_CODE: z.preprocess(blankToUndefined, z.string().default("94")),
  ORDER_RATE_LIMIT_PER_HOUR: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().positive().default(10),
  ),
});

export type ServerEnv = z.infer<typeof serverSchema>;

export type ServerEnvInput = {
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SMS_PROVIDER?: string;
  SMS_API_URL?: string;
  SMS_API_KEY?: string;
  SMS_API_SECRET?: string;
  SMS_SENDER_ID?: string;
  SMS_DEFAULT_COUNTRY_CODE?: string;
  ORDER_RATE_LIMIT_PER_HOUR?: string;
};

export function parseServerEnv(source: ServerEnvInput): ServerEnv {
  const parsed = serverSchema.safeParse(source);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.message}`).join("\n");
    throw new Error(`Missing or invalid server environment variables:\n${issues}`);
  }

  return parsed.data;
}

let cachedServerEnv: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser. Server secrets are not available.");
  }

  if (cachedServerEnv) return cachedServerEnv;

  cachedServerEnv = parseServerEnv({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SMS_PROVIDER: process.env.SMS_PROVIDER,
    SMS_API_URL: process.env.SMS_API_URL,
    SMS_API_KEY: process.env.SMS_API_KEY,
    SMS_API_SECRET: process.env.SMS_API_SECRET,
    SMS_SENDER_ID: process.env.SMS_SENDER_ID,
    SMS_DEFAULT_COUNTRY_CODE: process.env.SMS_DEFAULT_COUNTRY_CODE,
    ORDER_RATE_LIMIT_PER_HOUR: process.env.ORDER_RATE_LIMIT_PER_HOUR,
  });

  return cachedServerEnv;
}
