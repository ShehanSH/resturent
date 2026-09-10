import { describe, expect, it } from "vitest";

import {
  campaignTemplate,
  classifyImportedPhones,
  parseCustomerImportLines,
  smsSegmentCount,
} from "@/lib/sms/campaign";

describe("parseCustomerImportLines", () => {
  it("reads one phone per line and name,phone rows", () => {
    expect(parseCustomerImportLines("0766650952\nKasun, 0771234567")).toEqual([
      { phone: "0766650952", name: "Customer" },
      { phone: "0771234567", name: "Kasun" },
    ]);
  });

  it("skips a header row", () => {
    expect(parseCustomerImportLines("phone,name\n0766650952,Nimal")).toEqual([
      { phone: "0766650952", name: "Nimal" },
    ]);
  });
});

describe("classifyImportedPhones", () => {
  const existing = ["+94766650952"];

  it("marks numbers already in the database as duplicates", () => {
    const result = classifyImportedPhones(
      [
        { phone: "0766650952", name: "Nimal" },
        { phone: "0771234567", name: "Kasun" },
        { phone: "not-a-phone", name: "X" },
      ],
      existing,
    );
    expect(result.map((row) => row.status)).toEqual(["duplicate", "new", "invalid"]);
    expect(result[1]?.normalized).toBe("+94771234567");
  });

  it("treats the same number twice in one paste as a duplicate", () => {
    const result = classifyImportedPhones(
      [
        { phone: "0771234567", name: "A" },
        { phone: "+94771234567", name: "B" },
      ],
      [],
    );
    expect(result.map((row) => row.status)).toEqual(["new", "duplicate"]);
  });
});

describe("campaignTemplate", () => {
  const site = "https://hotbreadberuwala.vercel.app";

  it("uses the live order link in weekend, offer, and Friday texts", () => {
    expect(campaignTemplate("weekend", "Hot Bread Beruwala", site)).toContain("weekend specials are ON");
    expect(campaignTemplate("weekend", "Hot Bread Beruwala", site)).toContain(`${site}/`);
    expect(campaignTemplate("offer", "Hot Bread Beruwala", site)).toContain("new special offer");
    expect(campaignTemplate("friday", "Hot Bread Beruwala", site)).toContain("Chicken Pizza");
    expect(campaignTemplate("friday", "Hot Bread Beruwala", site)).toContain("Rs. 1,600");
    expect(campaignTemplate("custom", "Hot Bread Beruwala", site)).toBe("");
  });
});

describe("smsSegmentCount", () => {
  it("counts 160-character segments", () => {
    expect(smsSegmentCount("")).toBe(0);
    expect(smsSegmentCount("a".repeat(160))).toBe(1);
    expect(smsSegmentCount("a".repeat(161))).toBe(2);
  });
});
