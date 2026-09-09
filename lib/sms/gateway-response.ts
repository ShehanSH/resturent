import type { SendSmsResult } from "@/lib/sms/types";

/** Interprets Text.lk-style JSON (`status: true/false`) and plain HTTP errors. */
export function interpretGatewayResponse(httpStatus: number, rawBody: string): SendSmsResult {
  let parsed: Record<string, unknown> | null = null;
  try {
    const value: unknown = JSON.parse(rawBody);
    if (typeof value === "object" && value !== null) parsed = value as Record<string, unknown>;
  } catch {
    parsed = null;
  }

  const gatewayFailed =
    parsed?.status === false ||
    parsed?.status === "error" ||
    parsed?.success === false;

  if (!responseOk(httpStatus) || gatewayFailed) {
    const detail =
      (typeof parsed?.message === "string" && parsed.message) ||
      rawBody.slice(0, 300) ||
      `HTTP ${httpStatus}`;
    return { success: false, errorMessage: detail };
  }

  return {
    success: true,
    providerMessageId: extractMessageId(parsed),
  };
}

function responseOk(httpStatus: number): boolean {
  return httpStatus >= 200 && httpStatus < 300;
}

function extractMessageId(parsed: Record<string, unknown> | null): string | undefined {
  if (!parsed) return undefined;
  const data = (parsed.data ?? parsed) as Record<string, unknown>;
  for (const key of ["sms_id", "uid", "message_id", "messageId", "id", "reference"]) {
    const value = data[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return undefined;
}
