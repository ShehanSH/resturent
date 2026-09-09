import { z } from "zod";

import {
  moneySchema,
  optionalEmail,
  optionalText,
  optionalUrl,
  phoneSchema,
  uuidSchema,
} from "@/lib/validations/common";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:mm, for example 11:00");

export const businessHourSchema = z.object({
  day: z.coerce.number().int().min(0).max(6),
  is_open: z.boolean(),
  opens_at: timeSchema,
  closes_at: timeSchema,
});

export const restaurantSettingsSchema = z.object({
  restaurant_name: z.string().trim().min(2, "Restaurant name is required").max(120),
  tagline: optionalText(160),
  description: optionalText(2000),
  phone: z.union([phoneSchema, z.literal("")]).optional().transform((v) => (v ? v : null)),
  email: optionalEmail,
  address: optionalText(400),
  logo_url: optionalUrl,
  favicon_url: optionalUrl,
  hero_image_url: optionalUrl,
  currency: z.string().trim().length(3, "Use a 3-letter currency code").toUpperCase(),
  currency_symbol: z.string().trim().min(1).max(6),
  locale: z.string().trim().min(2).max(12),
  timezone: z.string().trim().min(3).max(64),
  default_delivery_fee: moneySchema,
  minimum_delivery_order: moneySchema,
  order_prefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,10}$/, "Use 2-10 uppercase letters or digits"),
  is_accepting_orders: z.boolean().default(true),
  allow_orders_when_closed: z.boolean().default(false),
  default_preparation_time: z.coerce.number().int().min(1).max(600),
  business_hours: z.array(businessHourSchema).length(7, "Provide hours for all seven days"),
  facebook_url: optionalUrl,
  instagram_url: optionalUrl,
  whatsapp_number: z
    .union([phoneSchema, z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  seo_title: optionalText(120),
  seo_description: optionalText(320),
});

export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;

/** Creating a staff member also provisions a Supabase Auth user. */
export const createStaffSchema = z.object({
  full_name: z.string().trim().min(2, "Enter the staff member's name").max(120),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .max(72, "Password is too long")
    .refine((value) => /[a-z]/.test(value), "Include a lowercase letter")
    .refine((value) => /[A-Z]/.test(value), "Include an uppercase letter")
    .refine((value) => /\d/.test(value), "Include a number"),
  phone: z.union([phoneSchema, z.literal("")]).optional().transform((v) => (v ? v : null)),
  role: z.enum(["ADMIN", "CASHIER", "DELIVERY"]),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
  id: uuidSchema,
  full_name: z.string().trim().min(2).max(120),
  phone: z.union([phoneSchema, z.literal("")]).optional().transform((v) => (v ? v : null)),
  role: z.enum(["ADMIN", "CASHIER", "DELIVERY"]),
  active: z.boolean(),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;
