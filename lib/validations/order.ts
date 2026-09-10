import { z } from "zod";

import { optionalEmail, optionalText, phoneSchema, uuidSchema } from "@/lib/validations/common";

/**
 * Checkout payload.
 *
 * Note what is *absent*: there is no price, subtotal, delivery fee or total.
 * The browser can only say which items and options it wants and how many. Every
 * monetary value is derived server-side by the `create_order` database
 * function, so a tampered client cannot influence what is charged.
 */

export const cartItemSchema = z.object({
  food_item_id: uuidSchema,
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity cannot exceed 99"),
  option_ids: z.preprocess(
    (value) => (Array.isArray(value) ? value.filter((id) => typeof id === "string" && id.length > 0) : []),
    z.array(uuidSchema).max(20, "Too many options selected"),
  ),
  notes: optionalText(280),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const checkoutSchema = z
  .object({
    customer_name: z
      .string()
      .trim()
      .min(2, "Please enter your name")
      .max(120, "Name is too long"),
    customer_phone: phoneSchema,
    customer_email: optionalEmail,
    order_type: z.enum(["PICKUP", "DELIVERY"], { error: "Choose pickup or delivery" }),
    delivery_address: optionalText(400),
    delivery_notes: optionalText(300),
    customer_notes: optionalText(500),
    items: z
      .array(cartItemSchema)
      .min(1, "Your cart is empty")
      .max(50, "An order cannot contain more than 50 distinct items"),
  })
  .refine(
    (value) => value.order_type !== "DELIVERY" || (value.delivery_address?.length ?? 0) >= 10,
    {
      message: "Please enter a delivery address",
      path: ["delivery_address"],
    },
  );

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "PICKED_UP",
  "CANCELLED",
]);

export const updateStatusSchema = z
  .object({
    order_id: uuidSchema,
    status: orderStatusSchema,
    notes: optionalText(300),
    cancellation_reason: optionalText(300),
  })
  .refine(
    (value) => value.status !== "CANCELLED" || (value.cancellation_reason?.length ?? 0) >= 3,
    {
      message: "Please give a reason for cancelling",
      path: ["cancellation_reason"],
    },
  );

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const assignDeliverySchema = z.object({
  order_id: uuidSchema,
  profile_id: uuidSchema.nullable(),
});

export const collectPaymentSchema = z.object({
  order_id: uuidSchema,
  notes: optionalText(300),
});

export const guestCancelSchema = z.object({
  token: z
    .string()
    .trim()
    .min(32, "Tracking link is not valid")
    .max(128, "Tracking link is not valid"),
  reason: optionalText(300),
});

export type GuestCancelInput = z.infer<typeof guestCancelSchema>;

export const orderSearchSchema = z.object({
  query: z.string().trim().max(120).optional(),
  status: orderStatusSchema.optional(),
  order_type: z.enum(["PICKUP", "DELIVERY"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type OrderSearchInput = z.infer<typeof orderSearchSchema>;
