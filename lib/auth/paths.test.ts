import { describe, expect, it } from "vitest";

import { safeStaffReturnPath } from "@/lib/auth/paths";

describe("safeStaffReturnPath", () => {
  it("keeps staff console paths", () => {
    expect(safeStaffReturnPath("/admin/orders", "/admin/dashboard")).toBe("/admin/orders");
    expect(safeStaffReturnPath("/cashier/orders/abc", "/cashier/orders")).toBe("/cashier/orders/abc");
  });

  it("rejects open redirects", () => {
    expect(safeStaffReturnPath("//evil.example", "/admin/dashboard")).toBe("/admin/dashboard");
    expect(safeStaffReturnPath("/menu", "/admin/dashboard")).toBe("/admin/dashboard");
    expect(safeStaffReturnPath("https://evil.example", "/admin/dashboard")).toBe("/admin/dashboard");
  });
});
