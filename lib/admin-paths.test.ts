import { describe, expect, it } from "vitest";

import {
  adminProductHref,
  adminProductsHref,
  resolveProductsCategory,
} from "@/lib/admin-paths";

const categories = [
  { id: "7d3201ff-47d7-46b4-8b0f-77c8332e4254", slug: "kottu" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", slug: "pizza" },
];

describe("adminProductsHref", () => {
  it("uses the category slug in the query", () => {
    expect(adminProductsHref({ category: "kottu" })).toBe("/admin/products?category=kottu");
    expect(adminProductsHref({ q: "chicken", category: "kottu" })).toBe(
      "/admin/products?q=chicken&category=kottu",
    );
  });
});

describe("adminProductHref", () => {
  it("keeps a readable path and category slug", () => {
    expect(adminProductHref("chicken-kottu", { category: "kottu" })).toBe(
      "/admin/products/chicken-kottu?category=kottu",
    );
  });
});

describe("resolveProductsCategory", () => {
  it("keeps a slug as-is", () => {
    expect(resolveProductsCategory("kottu", categories)).toEqual({
      categoryId: "7d3201ff-47d7-46b4-8b0f-77c8332e4254",
      categorySlug: "kottu",
      redirectToSlug: false,
    });
  });

  it("maps an old UUID query to the category slug", () => {
    expect(resolveProductsCategory("7d3201ff-47d7-46b4-8b0f-77c8332e4254", categories)).toEqual({
      categoryId: "7d3201ff-47d7-46b4-8b0f-77c8332e4254",
      categorySlug: "kottu",
      redirectToSlug: true,
    });
  });

  it("ignores empty and all filters", () => {
    expect(resolveProductsCategory("all", categories)).toEqual({ redirectToSlug: false });
    expect(resolveProductsCategory(undefined, categories)).toEqual({ redirectToSlug: false });
  });
});
