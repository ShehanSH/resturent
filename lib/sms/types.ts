import type { SmsEventType } from "@/types/database";

/**
 * The SMS boundary.
 *
 * Application code only ever depends on `SmsProvider`. Swapping Text.lk for
 * Notify.lk, Twilio or anything else means adding one file under
 * `lib/sms/providers/` and changing the `SMS_PROVIDER` environment variable —
 * no call site changes.
 */

export interface SendSmsRequest {
  phoneNumber: string;
  message: string;
}

export interface SendSmsResult {
  success: boolean;
  /** The provider's own id for the message, when it returns one. */
  providerMessageId?: string;
  errorMessage?: string;
}

export interface SmsProvider {
  /** Stable identifier recorded against every row in `sms_logs`. */
  readonly name: string;
  send(request: SendSmsRequest): Promise<SendSmsResult>;
}

export interface OrderSmsContext {
  orderNumber: string;
  customerName: string;
  restaurantName: string;
  trackingUrl: string;
}

export type SmsEvent = Exclude<SmsEventType, never>;
