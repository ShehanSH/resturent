import { describe, expect, it } from "vitest";

import { checkoutSchema } from "@/lib/validations/order";

const itemId = "11111111-1111-4111-8111-111111111111";
const optionId = "22222222-2222-4222-8222-222222222222";

describe("checkoutSchema", () => {
  it("accepts a pickup order when delivery fields are missing", () => {
    const parsed = checkoutSchema.safeParse({
      customer_name: "Shehan Senarathna",
      customer_phone: "0766650952",
      customer_email: "shehanhashen928@gmail.com",
      order_type: "PICKUP",
      delivery_address: null,
      delivery_notes: null,
      customer_notes: "test",
      items: [
        {
          food_item_id: itemId,
          quantity: 1,
          option_ids: [optionId],
          notes: null,
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it("requires a delivery address for delivery orders", () => {
    const parsed = checkoutSchema.safeParse({
      customer_name: "Shehan Senarathna",
      customer_phone: "0766650952",
      customer_email: "",
      order_type: "DELIVERY",
      delivery_address: "",
      items: [{ food_item_id: itemId, quantity: 1, option_ids: [], notes: "" }],
    });

    expect(parsed.success).toBe(false);
  });
});
