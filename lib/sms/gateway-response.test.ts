import { describe, expect, it } from "vitest";

import { interpretGatewayResponse } from "@/lib/sms/gateway-response";

describe("interpretGatewayResponse", () => {
  it("reads Text.lk success payloads", () => {
    const result = interpretGatewayResponse(
      200,
      JSON.stringify({
        status: true,
        message: "SMS queued successfully",
        data: { sms_id: "abc123", recipient: "94766650952" },
      }),
    );
    expect(result.success).toBe(true);
    expect(result.providerMessageId).toBe("abc123");
  });

  it("treats status:false as a failure even when HTTP is 200", () => {
    const result = interpretGatewayResponse(
      200,
      JSON.stringify({ status: false, message: "Invalid recipient number" }),
    );
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe("Invalid recipient number");
  });
});
