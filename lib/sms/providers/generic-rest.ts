import "server-only";

import { logger } from "@/lib/logger";
import { interpretGatewayResponse } from "@/lib/sms/gateway-response";
import { toGatewayRecipient } from "@/lib/sms/phone";
import type { SendSmsRequest, SendSmsResult, SmsProvider } from "@/lib/sms/types";

/**
 * REST SMS gateway (Text.lk and similar Sri Lankan providers).
 *
 *   SMS_PROVIDER=generic
 *   SMS_API_URL=https://app.text.lk/api/v3/sms/send
 *   SMS_API_KEY=<API token>
 *   SMS_SENDER_ID=<approved sender id, max 11 characters>
 */

interface GenericRestConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret?: string;
  senderId?: string;
}

const REQUEST_TIMEOUT_MS = 10_000;

export class GenericRestSmsProvider implements SmsProvider {
  readonly name = "generic-rest";

  constructor(private readonly config: GenericRestConfig) {}

  async send({ phoneNumber, message }: SendSmsRequest): Promise<SendSmsResult> {
    if (!this.config.senderId) {
      return { success: false, errorMessage: "SMS_SENDER_ID is required." };
    }

    const recipient = toGatewayRecipient(phoneNumber);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          recipient,
          sender_id: this.config.senderId,
          type: "plain",
          message,
          ...(this.config.apiSecret ? { api_secret: this.config.apiSecret } : {}),
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      const rawBody = await response.text();
      const result = interpretGatewayResponse(response.status, rawBody);
      if (!result.success) {
        logger.warn("sms.provider.http_error", { provider: this.name, status: response.status });
      }
      return result;
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "AbortError";
      logger.warn("sms.provider.request_failed", { provider: this.name, timeout: isTimeout });
      return {
        success: false,
        errorMessage: isTimeout
          ? "The SMS gateway did not respond in time."
          : error instanceof Error
            ? error.message
            : "Unknown SMS gateway error",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
