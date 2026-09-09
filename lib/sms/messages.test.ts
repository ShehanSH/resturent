import { describe, expect, it } from "vitest";

import { buildMessage, eventForStatus } from "@/lib/sms/messages";

const context = {
  orderNumber: "HBB-1002",
  customerName: "Kasun",
  restaurantName: "Hot Bread Beruwala",
  trackingUrl: "https://hotbread.lk/order/track/abc",
};

describe("eventForStatus", () => {
  it("texts pickup customers when the order is ready", () => {
    expect(eventForStatus("READY", "PICKUP")).toBe("ORDER_READY_PICKUP");
    expect(eventForStatus("READY", "DELIVERY")).toBeNull();
  });

  it("texts delivery customers when the order leaves the kitchen", () => {
    expect(eventForStatus("OUT_FOR_DELIVERY", "DELIVERY")).toBe("ORDER_OUT_FOR_DELIVERY");
  });
});

describe("buildMessage", () => {
  it("includes a tracking URL when the order is placed", () => {
    const message = buildMessage("ORDER_PLACED", context);
    expect(message).toContain("HBB-1002");
    expect(message).toContain(context.trackingUrl);
  });

  it("includes a tracking URL when pickup is ready", () => {
    expect(buildMessage("ORDER_READY_PICKUP", context)).toContain(context.trackingUrl);
  });

  it("asks delivery customers to have cash ready", () => {
    const message = buildMessage("ORDER_OUT_FOR_DELIVERY", context);
    expect(message).toContain("cash");
    expect(message).toContain(context.trackingUrl);
  });
});
