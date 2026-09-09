import { describe, expect, it } from "vitest";

import { currentMenuPath, productHref, safeMenuReturnPath } from "@/lib/public-paths";

describe("safeMenuReturnPath", () => {
  it("keeps the filtered menu the shopper came from", () => {
    expect(safeMenuReturnPath("/menu?category=kottu&q=chicken")).toBe("/menu?category=kottu&q=chicken");
    expect(safeMenuReturnPath("/menu/rice")).toBe("/menu/rice");
    expect(safeMenuReturnPath("/")).toBe("/");
  });

  it("rejects checkout, admin, and open redirects", () => {
    expect(safeMenuReturnPath("/cart")).toBe("/menu");
    expect(safeMenuReturnPath("/checkout")).toBe("/menu");
    expect(safeMenuReturnPath("/admin/orders")).toBe("/menu");
    expect(safeMenuReturnPath("//evil.example")).toBe("/menu");
    expect(safeMenuReturnPath("https://evil.example")).toBe("/menu");
  });
});

describe("productHref", () => {
  it("carries the return path on the product URL", () => {
    expect(productHref("chicken-kottu", "/menu?category=kottu")).toBe(
      "/products/chicken-kottu?from=%2Fmenu%3Fcategory%3Dkottu",
    );
  });
});

describe("currentMenuPath", () => {
  it("rebuilds the live menu query", () => {
    expect(currentMenuPath({ category: "kottu", q: "beef", sort: "name" })).toBe(
      "/menu?category=kottu&q=beef&sort=name",
    );
    expect(currentMenuPath({})).toBe("/menu");
  });
});
