import { describe, expect, it } from "vitest";

import { canCollectOrderPayment, guestCanCancel, guestNeedsStaffToCancel } from "@/lib/orders/transitions";

describe("guest cancel rules", () => {
  it("allows cancel only while the order is still pending", () => {
    expect(guestCanCancel("PENDING")).toBe(true);
    expect(guestCanCancel("CONFIRMED")).toBe(false);
    expect(guestCanCancel("PREPARING")).toBe(false);
    expect(guestCanCancel("CANCELLED")).toBe(false);
  });

  it("asks the guest to call after the kitchen confirms", () => {
    expect(guestNeedsStaffToCancel("CONFIRMED")).toBe(true);
    expect(guestNeedsStaffToCancel("PREPARING")).toBe(true);
    expect(guestNeedsStaffToCancel("PENDING")).toBe(false);
    expect(guestNeedsStaffToCancel("CANCELLED")).toBe(false);
    expect(guestNeedsStaffToCancel("PICKED_UP")).toBe(false);
  });
});

describe("cancelled orders and payment", () => {
  it("does not allow collecting payment on a cancelled order", () => {
    expect(canCollectOrderPayment("CANCELLED", "PENDING")).toBe(false);
    expect(canCollectOrderPayment("CANCELLED", "COLLECTED")).toBe(false);
    expect(canCollectOrderPayment("PREPARING", "PENDING")).toBe(true);
  });
});
