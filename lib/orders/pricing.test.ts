import { describe, expect, it } from "vitest";

import { cartSubtotal, deliveryFee, effectiveUnitPrice, lineTotal, meetsDeliveryMinimum, orderTotal } from "@/lib/orders/pricing";
import { allowedNextStatuses, canRoleSetStatus, isValidStatusTransition } from "@/lib/orders/transitions";
import { slugify } from "@/lib/format";
import { restaurantAddress, restaurantMapsUrl } from "@/lib/brand";
import { autoSeoTitle, categorySeoDescription, seoPlaceName } from "@/lib/seo";

describe("pricing", () => {
  it("computes a line total from unit price, options and quantity", () => {
    expect(
      lineTotal({
        unit_price: 1450,
        quantity: 2,
        options: [{ price_adjustment: 200 }, { price_adjustment: 150 }],
      }),
    ).toBe(3600);
  });

  it("never returns a negative quantity line", () => {
    expect(lineTotal({ unit_price: 100, quantity: -3, options: [] })).toBe(0);
  });

  it("uses the discount price when it is lower than the regular price", () => {
    expect(effectiveUnitPrice(1750, 1550)).toBe(1550);
    expect(effectiveUnitPrice(1750, 2000)).toBe(1750);
    expect(effectiveUnitPrice(1750, null)).toBe(1750);
  });

  it("charges no delivery fee for pickup", () => {
    expect(deliveryFee("PICKUP", 2000, { default_delivery_fee: 350, minimum_delivery_order: 1500 })).toBe(0);
  });

  it("applies the configured delivery fee for delivery orders", () => {
    expect(deliveryFee("DELIVERY", 2000, { default_delivery_fee: 350, minimum_delivery_order: 1500 })).toBe(350);
  });

  it("enforces the delivery minimum against the subtotal", () => {
    expect(meetsDeliveryMinimum(1400, { default_delivery_fee: 350, minimum_delivery_order: 1500 })).toBe(false);
    expect(meetsDeliveryMinimum(1500, { default_delivery_fee: 350, minimum_delivery_order: 1500 })).toBe(true);
  });

  it("totals pickup and delivery orders correctly", () => {
    const items = [{ unit_price: 1000, quantity: 2, options: [{ price_adjustment: 100 }] }];
    expect(orderTotal(items, "PICKUP", { default_delivery_fee: 350, minimum_delivery_order: 0 })).toEqual({
      subtotal: 2200,
      discount: 0,
      delivery_fee: 0,
      total: 2200,
    });
    expect(orderTotal(items, "DELIVERY", { default_delivery_fee: 350, minimum_delivery_order: 0 })).toEqual({
      subtotal: 2200,
      discount: 0,
      delivery_fee: 350,
      total: 2550,
    });
  });

  it("sums the cart without trusting a client total", () => {
    expect(
      cartSubtotal([
        { unit_price: 10, quantity: 1, options: [] },
        { unit_price: 5, quantity: 3, options: [{ price_adjustment: 1 }] },
      ]),
    ).toBe(28);
  });
});

describe("order transitions", () => {
  it("allows the pickup lifecycle and rejects skipped states", () => {
    expect(isValidStatusTransition("PENDING", "CONFIRMED", "PICKUP")).toBe(true);
    expect(isValidStatusTransition("READY", "PICKED_UP", "PICKUP")).toBe(true);
    expect(isValidStatusTransition("READY", "DELIVERED", "PICKUP")).toBe(false);
    expect(isValidStatusTransition("PICKED_UP", "PENDING", "PICKUP")).toBe(false);
  });

  it("uses a different ready-state next step for delivery", () => {
    expect(isValidStatusTransition("READY", "OUT_FOR_DELIVERY", "DELIVERY")).toBe(true);
    expect(isValidStatusTransition("READY", "PICKED_UP", "DELIVERY")).toBe(false);
  });

  it("limits cashiers and delivery riders", () => {
    expect(canRoleSetStatus("CASHIER", "PICKED_UP")).toBe(true);
    expect(canRoleSetStatus("CASHIER", "OUT_FOR_DELIVERY")).toBe(false);
    expect(canRoleSetStatus("DELIVERY", "DELIVERED")).toBe(true);
    expect(canRoleSetStatus("DELIVERY", "CONFIRMED")).toBe(false);
    expect(allowedNextStatuses("READY", "DELIVERY", "DELIVERY")).toEqual(["OUT_FOR_DELIVERY"]);
  });
});

describe("slug and seo", () => {
  it("slugifies a dish name", () => {
    expect(slugify("Chicken Cheese Burger!")).toBe("chicken-cheese-burger");
  });

  it("builds an automatic SEO title", () => {
    expect(autoSeoTitle("Burgers", "Spice Route Kitchen")).toBe(
      "Order Burgers Online | Spice Route Kitchen",
    );
  });

  it("uses the town, not the country, and never cuts a word", () => {
    expect(seoPlaceName("Hot Bread Beruwala", "Main Street, Beruwala, Sri Lanka")).toBe("Beruwala");
    expect(seoPlaceName("Hot Bread Beruwala", "Colombo 04")).toBe("Beruwala");
    const description = categorySeoDescription({
      name: "STARTER",
      restaurantName: "Hot Bread Beruwala",
      description: "Essential dishes and popular favorites to get your meal started.",
      location: seoPlaceName("Hot Bread Beruwala", "Main Street, Beruwala, Sri Lanka"),
    });
    expect(description).toContain("Beruwala");
    expect(description).not.toMatch(/Sri Lan/);
    expect(description.endsWith("…")).toBe(false);
  });

  it("keeps the Beruwala shop address and maps pin", () => {
    expect(restaurantAddress("Colombo 04")).toBe("157/ EF Galle Rd, Beruwala");
    expect(restaurantAddress("157/ EF Galle Rd, Beruwala")).toBe("157/ EF Galle Rd, Beruwala");
    expect(restaurantMapsUrl("Colombo 04")).toContain("Beruwala");
  });
});
