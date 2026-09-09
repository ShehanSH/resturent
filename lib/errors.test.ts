import { describe, expect, it } from "vitest";

import { AppError, toUserMessage } from "@/lib/errors";

describe("toUserMessage", () => {
  it("returns AppError messages as-is", () => {
    expect(toUserMessage(new AppError("Wait a few minutes.", "RATE_LIMITED"))).toBe(
      "Wait a few minutes.",
    );
  });

  it("does not treat a normal Error as a database error", () => {
    expect(
      toUserMessage(new Error("Missing or invalid server environment variables"), "fallback"),
    ).toBe("fallback");
  });

  it("uses custom order SQLSTATE messages", () => {
    expect(
      toUserMessage(
        {
          code: "R0005",
          message: "Please complete the required choices for each item.",
          details: null,
          hint: null,
        },
        "fallback",
      ),
    ).toBe("Please complete the required choices for each item.");
  });

  it("surfaces user-facing P0001 raise messages", () => {
    expect(
      toUserMessage(
        {
          code: "P0001",
          message: "The restaurant is currently closed and not accepting orders.",
          details: null,
          hint: null,
        },
        "fallback",
      ),
    ).toBe("The restaurant is currently closed and not accepting orders.");
  });
});
