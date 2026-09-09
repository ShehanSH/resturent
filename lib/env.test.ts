import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env";

const serviceRoleKey = "service-role-key-that-is-long-enough";

describe("parseServerEnv", () => {
  it("accepts blank SMS fields and defaults the provider to disabled", () => {
    const env = parseServerEnv({
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
      SMS_PROVIDER: "",
      SMS_API_URL: "",
      SMS_API_KEY: "",
      SMS_API_SECRET: "",
      SMS_SENDER_ID: "",
      SMS_DEFAULT_COUNTRY_CODE: "",
      ORDER_RATE_LIMIT_PER_HOUR: "",
    });

    expect(env.SMS_PROVIDER).toBe("disabled");
    expect(env.SMS_API_URL).toBeUndefined();
    expect(env.SMS_DEFAULT_COUNTRY_CODE).toBe("94");
    expect(env.ORDER_RATE_LIMIT_PER_HOUR).toBe(10);
  });

  it("keeps an explicit console provider", () => {
    const env = parseServerEnv({
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
      SMS_PROVIDER: "console",
    });

    expect(env.SMS_PROVIDER).toBe("console");
  });
});
