import "server-only";

import { logger } from "@/lib/logger";
import { maskPhone } from "@/lib/sms/phone";
import type { SendSmsRequest, SendSmsResult, SmsProvider } from "@/lib/sms/types";

/**
 * Development provider. Writes the message to the server log instead of
 * sending it, so the whole notification flow can be exercised end to end
 * without a gateway account or spending credits.
 */
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";

  async send({ phoneNumber, message }: SendSmsRequest): Promise<SendSmsResult> {
    logger.info("sms.console.send", {
      phoneNumber: maskPhone(phoneNumber),
      messageLength: message.length,
    });
    return {
      success: true,
      providerMessageId: `console-${Date.now()}`,
    };
  }
}

/**
 * Used when `SMS_PROVIDER=disabled`. Reports a skip rather than a failure so
 * the logs distinguish "switched off" from "the gateway broke".
 */
export class DisabledSmsProvider implements SmsProvider {
  readonly name = "disabled";

  async send(): Promise<SendSmsResult> {
    return { success: false, errorMessage: "SMS notifications are disabled." };
  }
}
