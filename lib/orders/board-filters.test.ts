import { describe, expect, it } from "vitest";

import {
  adminOrdersHref,
  boardSearchClause,
  orderMatchesBoardWindow,
  orderMatchesSearch,
  parseBoardSearchParams,
  resolveBoardRange,
} from "@/lib/orders/board-filters";
import { rangeForCalendarDate, startOfRestaurantDay } from "@/lib/timezone";

const COLOMBO = "Asia/Colombo";
const NOW = new Date("2026-09-10T06:00:00.000Z"); // 11:30 in Colombo
const TODAY = "2026-09-10";

describe("restaurant calendar days", () => {
  it("anchors today to Colombo midnight", () => {
    expect(startOfRestaurantDay(COLOMBO, 0, NOW).toISOString()).toBe("2026-09-09T18:30:00.000Z");
  });

  it("builds a half-open range for a picked calendar date", () => {
    expect(rangeForCalendarDate(COLOMBO, "2026-09-08")).toEqual({
      from: new Date("2026-09-07T18:30:00.000Z"),
      to: new Date("2026-09-08T18:30:00.000Z"),
    });
  });
});

describe("adminOrdersHref", () => {
  it("omits today's range from the URL", () => {
    expect(adminOrdersHref({ today: TODAY })).toBe("/admin/orders");
    expect(adminOrdersHref({ from: TODAY, to: TODAY, q: "Ayesha", today: TODAY })).toBe(
      "/admin/orders?q=Ayesha",
    );
  });

  it("writes from/to for a selected range", () => {
    expect(adminOrdersHref({ from: "2026-09-01", to: "2026-09-08", today: TODAY })).toBe(
      "/admin/orders?from=2026-09-01&to=2026-09-08",
    );
    expect(adminOrdersHref({ from: "2026-09-08", to: "2026-09-08", today: TODAY })).toBe(
      "/admin/orders?from=2026-09-08",
    );
  });

  it("uses all=1 and drops dates for all orders", () => {
    expect(adminOrdersHref({ all: true, from: "2026-09-01", today: TODAY })).toBe(
      "/admin/orders?all=1",
    );
    expect(adminOrdersHref({ all: true, q: "Ayesha", today: TODAY })).toBe(
      "/admin/orders?all=1&q=Ayesha",
    );
  });
});

describe("parseBoardSearchParams", () => {
  it("reads a date range and search", () => {
    expect(parseBoardSearchParams({ from: "2026-09-08", to: "2026-09-10", q: " Ayesha " })).toEqual({
      from: "2026-09-08",
      to: "2026-09-10",
      q: "Ayesha",
      all: false,
    });
  });

  it("reads the all-orders flag", () => {
    expect(parseBoardSearchParams({ all: "1", q: "Ayesha" })).toMatchObject({
      all: true,
      q: "Ayesha",
    });
  });
});

describe("resolveBoardRange", () => {
  it("defaults to today when dates are missing", () => {
    const range = resolveBoardRange({}, COLOMBO, TODAY);
    expect(range.all).toBe(false);
    expect(range.fromDate).toBe(TODAY);
    expect(range.toDate).toBe(TODAY);
    expect(range.from?.toISOString()).toBe("2026-09-09T18:30:00.000Z");
    expect(range.to?.toISOString()).toBe("2026-09-10T18:30:00.000Z");
  });

  it("swaps inverted dates and spans inclusive calendar days", () => {
    const range = resolveBoardRange({ from: "2026-09-10", to: "2026-09-08" }, COLOMBO, TODAY);
    expect(range.fromDate).toBe("2026-09-08");
    expect(range.toDate).toBe("2026-09-10");
    expect(range.from?.toISOString()).toBe("2026-09-07T18:30:00.000Z");
    expect(range.to?.toISOString()).toBe("2026-09-10T18:30:00.000Z");
  });

  it("drops the date window for all orders", () => {
    const range = resolveBoardRange({ all: true, from: "2026-09-08" }, COLOMBO, TODAY);
    expect(range).toEqual({ all: true, fromDate: "", toDate: "" });
  });
});

describe("order search", () => {
  const order = {
    order_number: "HBB-1262",
    customer_name: "Ayesha Fernando",
    customer_phone: "94771234001",
  };

  it("matches a customer name, local phone, or last digits", () => {
    expect(orderMatchesSearch(order, "ayesha")).toBe(true);
    expect(orderMatchesSearch(order, "0771234001")).toBe(true);
    expect(orderMatchesSearch(order, "771234001")).toBe(true);
    expect(orderMatchesSearch(order, "HBB-1262")).toBe(true);
    expect(orderMatchesSearch(order, "Nuwan")).toBe(false);
  });

  it("adds a last-9-digit phone clause for PostgREST", () => {
    expect(boardSearchClause("0771234001")).toContain("customer_phone.ilike.%771234001%");
  });

  it("keeps an order inside a half-open day window", () => {
    const range = rangeForCalendarDate(COLOMBO, "2026-09-10")!;
    expect(orderMatchesBoardWindow("2026-09-10T06:00:00.000Z", range)).toBe(true);
    expect(orderMatchesBoardWindow("2026-09-09T10:00:00.000Z", range)).toBe(false);
  });
});
