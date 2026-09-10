import { logger } from "@/lib/logger";

/**
 * Error handling.
 *
 * `AppError` carries a message that is safe to render to an end user. Anything
 * else — Postgres errors, network failures, bugs — is logged server side and
 * replaced with a generic message, so stack traces and SQL never leak into the
 * browser.
 */
export class AppError extends Error {
  readonly code: string;

  constructor(message: string, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

/** Custom SQLSTATE codes raised by the order functions in migration 0004. */
const DB_ERROR_MESSAGES: Record<string, string> = {
  R0001: "The restaurant is not accepting orders right now.",
  R0002: "There is a problem with the items in your cart.",
  R0003: "One of the items in your cart is no longer available.",
  R0004: "One of the options you selected is not valid.",
  R0005: "Please complete the required choices for each item.",
  R0006: "Your order is below the delivery minimum.",
  R0007: "That change is not allowed for this order.",
  R0008: "You do not have permission to do that.",
  R0009: "We could not find that order.",
  R0010: "This order has already been confirmed. Please call the restaurant to cancel.",
  "23505": "That record already exists.",
  "23503": "This record is still referenced elsewhere and cannot be removed.",
  "23514": "Some of the values supplied are not valid.",
};

interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

function isPostgrestError(value: unknown): value is PostgrestLikeError {
  if (typeof value !== "object" || value === null) return false;
  const maybe = value as Record<string, unknown>;
  // A normal `Error` also has `message`. PostgREST errors additionally carry
  // `code` plus `details`/`hint` (often null).
  return (
    typeof maybe.message === "string" &&
    typeof maybe.code === "string" &&
    ("details" in maybe || "hint" in maybe)
  );
}

function looksLikeUserDbMessage(message: string): boolean {
  const lower = message.toLowerCase();
  if (
    lower.includes("permission denied") ||
    lower.includes("relation ") ||
    lower.includes("column ") ||
    lower.includes("syntax error") ||
    lower.includes("function ") ||
    lower.includes("operator does not exist")
  ) {
    return false;
  }
  return message.length > 0 && message.length <= 280;
}

/**
 * Converts anything thrown by Supabase or application code into a message that
 * is safe to show a user. The original error is always logged.
 */
export function toUserMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof AppError) return error.message;

  if (isPostgrestError(error)) {
    const code = error.code ?? "";
    const message = error.message?.trim() ?? "";

    // The database raises these deliberately, with wording written for users.
    if (code.startsWith("R0")) {
      return message || DB_ERROR_MESSAGES[code] || fallback;
    }

    if (DB_ERROR_MESSAGES[code]) {
      logger.error("database.error", { code, message: error.message, details: error.details });
      return DB_ERROR_MESSAGES[code];
    }

    // Custom SQLSTATE values are sometimes flattened to P0001 by PostgREST.
    if (code === "P0001" && looksLikeUserDbMessage(message)) {
      return message;
    }

    logger.error("database.unexpected", { code, message: error.message, details: error.details });
    return fallback;
  }

  logger.error("unhandled.error", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return fallback;
}

/** Standard shape returned by every server action. */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function actionFailure(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { success: false, error, fieldErrors };
}
