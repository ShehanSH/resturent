/**
 * Minimal structured logger.
 *
 * Emits one JSON object per line so Vercel's log drains can parse it. Keys that
 * commonly hold secrets are redacted defensively — nothing here should ever
 * receive a password, token or API key in the first place.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
  "secret",
  "service_role_key",
  "authorization",
  "tracking_token",
  "phone",
  "phonenumber",
  "phone_number",
  "customer_phone",
  "recipient",
]);

function redact(context: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    output[key] = REDACTED_KEYS.has(key.toLowerCase()) ? "[redacted]" : value;
  }
  return output;
}

function write(level: LogLevel, event: string, context: Record<string, unknown> = {}) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;

  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...redact(context),
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, context?: Record<string, unknown>) => write("debug", event, context),
  info: (event: string, context?: Record<string, unknown>) => write("info", event, context),
  warn: (event: string, context?: Record<string, unknown>) => write("warn", event, context),
  error: (event: string, context?: Record<string, unknown>) => write("error", event, context),
};
