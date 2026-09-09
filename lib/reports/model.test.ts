import { describe, expect, it } from "vitest";

import { buildExcelWorkbook } from "@/lib/reports/excel";
import { buildReportDocument, rankPerformance, sharePercent } from "@/lib/reports/model";
import { parseRangePreset } from "@/lib/reports/range";
import type { AnalyticsSummary } from "@/lib/services/analytics.types";

const emptySummary: AnalyticsSummary = {
  total_orders: 7,
  revenue: 39320,
  pending_orders: 0,
  active_orders: 1,
  completed_orders: 6,
  cancelled_orders: 0,
  pickup_orders: 4,
  delivery_orders: 3,
  items_sold: 18,
  average_order_value: 5617.14,
  uncollected_payments: 0,
};

describe("parseRangePreset", () => {
  it("accepts known presets and falls back to 7 days", () => {
    expect(parseRangePreset("today")).toBe("today");
    expect(parseRangePreset("90d")).toBe("90d");
    expect(parseRangePreset("nope")).toBe("7d");
    expect(parseRangePreset(undefined)).toBe("7d");
  });
});

describe("sharePercent", () => {
  it("returns one-decimal share of a total", () => {
    expect(sharePercent(17910, 39320)).toBe(45.5);
  });

  it("returns 0 when the total is 0", () => {
    expect(sharePercent(10, 0)).toBe(0);
  });
});

describe("rankPerformance", () => {
  it("adds share, average, and bar widths relative to the top row", () => {
    const ranked = rankPerformance(
      [
        { name: "Pizza", quantity: 6, revenue: 18000 },
        { name: "Burger", quantity: 4, revenue: 9000 },
      ],
      27000,
    );

    expect(ranked[0]).toMatchObject({ share: 66.7, average: 3000, bar: 100 });
    expect(ranked[1]).toMatchObject({ share: 33.3, average: 2250, bar: 50 });
  });
});

describe("buildReportDocument", () => {
  it("names the download file from the preset and restaurant timezone date", () => {
    const report = buildReportDocument({
      restaurantName: "Hot Bread Beruwala",
      rangePreset: "7d",
      range: {
        from: new Date("2026-09-03T18:30:00.000Z"),
        to: new Date("2026-09-09T18:30:00.000Z"),
      },
      timezone: "Asia/Colombo",
      locale: "en-LK",
      currency: { currency: "LKR", currency_symbol: "Rs.", locale: "en-LK" },
      generatedAt: new Date("2026-09-09T13:00:00.000Z"),
      summary: emptySummary,
      trend: [{ day: "2026-09-08", orders: 2, revenue: 5000 }],
      categories: [{ category_name: "Pizza", quantity: 6, revenue: 17910 }],
      items: [{ item_name: "Double Beef Burger", quantity: 4, revenue: 10150 }],
      types: [{ order_type: "PICKUP", orders: 4, revenue: 20000 }],
      status: [{ status: "PICKED_UP", orders: 4 }],
    });

    expect(report.rangeLabel).toBe("Last 7 days");
    expect(report.fileBase).toBe("sales-report-7d-2026-09-09");
    expect(report.categories[0]?.name).toBe("Pizza");
    expect(report.items[0]?.name).toBe("Double Beef Burger");
  });
});

describe("buildExcelWorkbook", () => {
  it("includes summary, category, and item sheets", () => {
    const report = buildReportDocument({
      restaurantName: "Hot Bread Beruwala",
      rangePreset: "today",
      range: {
        from: new Date("2026-09-08T18:30:00.000Z"),
        to: new Date("2026-09-09T18:30:00.000Z"),
      },
      timezone: "Asia/Colombo",
      locale: "en-LK",
      currency: { currency: "LKR", currency_symbol: "Rs.", locale: "en-LK" },
      generatedAt: new Date("2026-09-09T13:00:00.000Z"),
      summary: emptySummary,
      trend: [],
      categories: [{ category_name: "Kottu & Co", quantity: 2, revenue: 2400 }],
      items: [{ item_name: "Cheese <Special>", quantity: 1, revenue: 1200 }],
      types: [],
      status: [],
    });

    const xml = buildExcelWorkbook(report);

    expect(xml).toContain("ss:Name=\"Summary\"");
    expect(xml).toContain("ss:Name=\"Categories\"");
    expect(xml).toContain("ss:Name=\"Items\"");
    expect(xml).toContain("Kottu &amp; Co");
    expect(xml).toContain("Cheese &lt;Special&gt;");
    expect(xml).toContain("39320");
  });
});
