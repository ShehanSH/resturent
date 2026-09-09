import { z } from "zod";

/**
 * Shared Zod building blocks. Written against the Zod 4 API, where string
 * formats are top-level (`z.url()`, `z.uuid()`, `z.iso.datetime()`) rather than
 * chained off `z.string()`.
 */

/**
 * Sri Lankan mobile numbers arrive in several shapes: 0771234567,
 * +94771234567, 94771234567, or with spaces and dashes. Normalise to
 * `+94XXXXXXXXX` so the same customer is always recognised.
 */
export function normalisePhone(input: string, defaultCountryCode = "94"): string {
  const cleaned = input.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("0")) return `+${defaultCountryCode}${cleaned.slice(1)}`;
  if (cleaned.startsWith(defaultCountryCode)) return `+${cleaned}`;

  return `+${defaultCountryCode}${cleaned}`;
}

export const phoneSchema = z
  .string()
  .trim()
  .min(9, "Enter a valid phone number")
  .max(20, "Enter a valid phone number")
  .refine((value) => /^[\d\s+()-]+$/.test(value), "Phone number contains invalid characters")
  .refine((value) => value.replace(/\D/g, "").length >= 9, "Enter a valid phone number");

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120, "Slug is too long")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only");

export const uuidSchema = z.uuid("Invalid identifier");

export const emailSchema = z.email("Enter a valid email address");

/** An optional URL field that submits as "" from a form and stores as NULL. */
export const optionalUrl = z.preprocess(
  (value) => (value == null ? "" : value),
  z
    .union([z.url("Enter a valid URL"), z.literal("")])
    .transform((value) => (value ? value : null)),
);

/** An optional free-text field that submits as "" from a form and stores as NULL. */
export const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value == null ? "" : value),
    z
      .string()
      .trim()
      .max(max, `Must be ${max} characters or fewer`)
      .transform((value) => (value ? value : null)),
  );

export const optionalEmail = z.preprocess(
  (value) => (value == null ? "" : value),
  z
    .union([z.email("Enter a valid email address"), z.literal("")])
    .transform((value) => (value ? value : null)),
);

export const moneySchema = z.coerce
  .number({ error: "Enter a valid amount" })
  .nonnegative("Amount cannot be negative")
  .max(9_999_999, "Amount is too large")
  .refine((value) => Number.isFinite(value), "Enter a valid amount")
  // Guards against a stray third decimal producing rounding drift downstream.
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-9, {
    message: "Use at most 2 decimal places",
  });

export const positiveMoneySchema = moneySchema.refine(
  (value) => value > 0,
  "Amount must be greater than zero",
);

/** Treat blank form values as unset before number coercion. */
export function emptyToUndefined(value: unknown): unknown {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}

export const optionalPositiveMoney = z.preprocess(
  emptyToUndefined,
  moneySchema
    .refine((value) => value > 0, "Amount must be greater than zero")
    .optional(),
).transform((value) => value ?? null);

export const optionalPrepMinutes = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ error: "Enter minutes as a number" })
    .int("Use whole minutes")
    .positive("Prep time must be greater than zero")
    .max(600, "Prep time is too long")
    .optional(),
).transform((value) => value ?? null);

export const dateRangeSchema = z
  .object({
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
  })
  .refine((value) => new Date(value.from) < new Date(value.to), {
    message: "The start date must be before the end date",
    path: ["from"],
  });

export type DateRange = z.infer<typeof dateRangeSchema>;

/** Turns a Zod error into the flat `{ field: [messages] }` shape actions return. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key =
      issue.path.length === 0
        ? "_form"
        : issue.path
            .map(String)
            .join(".")
            .replace(/^\.+/, "");
    const field = key.split(".")[0] || "_form";
    if (!fieldErrors[field]) fieldErrors[field] = [];
    if (!fieldErrors[field].includes(issue.message)) fieldErrors[field].push(issue.message);
  }
  return fieldErrors;
}
