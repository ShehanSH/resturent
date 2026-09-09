import { describe, expect, it } from "vitest";

import { maskPhone, toGatewayRecipient } from "@/lib/sms/phone";

describe("toGatewayRecipient", () => {
  it("strips plus and formatting for Text.lk", () => {
    expect(toGatewayRecipient("+94766650952")).toBe("94766650952");
    expect(toGatewayRecipient("94766650952")).toBe("94766650952");
  });
});

describe("maskPhone", () => {
  it("keeps only the last four digits", () => {
    expect(maskPhone("+94766650952")).toBe("***0952");
  });
});
