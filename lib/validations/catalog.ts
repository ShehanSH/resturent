import { z } from "zod";

import {
  moneySchema,
  optionalPrepMinutes,
  optionalPositiveMoney,
  optionalText,
  optionalUrl,
  positiveMoneySchema,
  slugSchema,
  uuidSchema,
} from "@/lib/validations/common";

/** Category create/update payload used by the admin forms and server actions. */
export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  slug: slugSchema,
  description: optionalText(1000),
  image_url: optionalUrl,
  display_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  seo_title: optionalText(120),
  seo_description: optionalText(320),
  seo_keywords: z
    .array(z.string().trim().min(1).max(40))
    .max(15, "Use at most 15 keywords")
    .optional()
    .transform((value) => (value?.length ? value : null)),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const foodItemSchema = z
  .object({
    category_id: z.preprocess(
      (value) => (value === "" || value === null || value === undefined ? undefined : value),
      z.uuid("Choose a category"),
    ),
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120, "Name is too long"),
    slug: slugSchema,
    short_description: optionalText(160),
    description: optionalText(2000),
    price: positiveMoneySchema,
    discount_price: optionalPositiveMoney,
    image_url: optionalUrl,
    preparation_time: optionalPrepMinutes,
    display_order: z.coerce.number().int().min(0).max(9999).default(0),
    is_available: z.boolean().default(true),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    seo_title: optionalText(120),
    seo_description: optionalText(320),
    seo_keywords: z
      .array(z.string().trim().min(1).max(40))
      .max(15, "Use at most 15 keywords")
      .optional()
      .transform((value) => (value?.length ? value : null)),
    option_group_ids: z.array(uuidSchema).max(20).default([]),
  })
  .refine(
    (value) => value.discount_price === null || value.discount_price < value.price,
    { message: "The discounted price must be lower than the regular price", path: ["discount_price"] },
  );

export type FoodItemInput = z.infer<typeof foodItemSchema>;

export const optionGroupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    description: optionalText(300),
    selection_type: z.enum(["SINGLE", "MULTIPLE"]),
    is_required: z.boolean().default(false),
    min_select: z.coerce.number().int().min(0).max(20).default(0),
    max_select: z
      .union([z.coerce.number().int().min(1).max(20), z.literal("")])
      .optional()
      .transform((value) => (value === "" || value === undefined ? null : Number(value))),
    display_order: z.coerce.number().int().min(0).max(9999).default(0),
    is_active: z.boolean().default(true),
  })
  .refine((value) => value.max_select === null || value.max_select >= Math.max(value.min_select, 1), {
    message: "The maximum must be at least the minimum",
    path: ["max_select"],
  })
  .refine((value) => value.selection_type !== "SINGLE" || (value.max_select ?? 1) === 1, {
    message: "A single-choice group can only allow one selection",
    path: ["max_select"],
  })
  .refine((value) => !value.is_required || value.min_select >= 1, {
    message: "A required group must ask for at least one selection",
    path: ["min_select"],
  });

export type OptionGroupInput = z.infer<typeof optionGroupSchema>;

export const optionChoiceDraftSchema = z.object({
  id: z.preprocess(
    (value) => (typeof value === "string" && value.length > 0 ? value : undefined),
    z.uuid().optional(),
  ),
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  price_adjustment: z.coerce
    .number({ error: "Enter a valid amount" })
    .min(-99999)
    .max(99999)
    .default(0),
  is_available: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

export const optionGroupChoicesSchema = z
  .array(optionChoiceDraftSchema)
  .min(1, "Add at least one choice");

export type OptionChoiceDraft = z.infer<typeof optionChoiceDraftSchema>;

export const optionSchema = z.object({
  option_group_id: uuidSchema,
  name: z.string().trim().min(1, "Name is required").max(80),
  price_adjustment: z.coerce
    .number({ error: "Enter a valid amount" })
    .min(-99999)
    .max(99999)
    .default(0),
  display_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_available: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

export type OptionInput = z.infer<typeof optionSchema>;
