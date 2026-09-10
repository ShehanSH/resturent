import type { OrderSmsContext, SmsEvent } from "@/lib/sms/types";

/**
 * Customer SMS copy. Each message includes the public tracking link so the
 * guest can open the live status page from their phone.
 */

type TemplateFn = (context: OrderSmsContext) => string;

const TEMPLATES: Record<SmsEvent, TemplateFn | null> = {
  ORDER_PLACED: ({ orderNumber, restaurantName, trackingUrl }) =>
    `${restaurantName}: we received order #${orderNumber}. Track it here: ${trackingUrl}`,

  ORDER_CONFIRMED: null,

  ORDER_READY_PICKUP: ({ orderNumber, restaurantName, trackingUrl }) =>
    `${restaurantName}: order #${orderNumber} is ready for pickup. Track it: ${trackingUrl}`,

  ORDER_OUT_FOR_DELIVERY: ({ orderNumber, restaurantName, trackingUrl }) =>
    `${restaurantName}: order #${orderNumber} is on the way. Please have cash ready. Track it: ${trackingUrl}`,

  ORDER_DELIVERED: null,

  ORDER_CANCELLED: ({ orderNumber, restaurantName }) =>
    `${restaurantName}: order #${orderNumber} has been cancelled. Please call us if you have questions.`,

  CAMPAIGN: null,
};

export function buildMessage(event: SmsEvent, context: OrderSmsContext): string | null {
  const template = TEMPLATES[event];
  return template ? template(context) : null;
}

/**
 * Status changes that notify the customer. Pickup "ready" and delivery
 * "out for delivery" are the moments they need to come to the restaurant or
 * wait outside. Confirm / delivered are kitchen noise and are not texted.
 */
export function eventForStatus(
  status: string,
  orderType: "PICKUP" | "DELIVERY",
): SmsEvent | null {
  switch (status) {
    case "READY":
      return orderType === "PICKUP" ? "ORDER_READY_PICKUP" : null;
    case "OUT_FOR_DELIVERY":
      return "ORDER_OUT_FOR_DELIVERY";
    case "CANCELLED":
      return "ORDER_CANCELLED";
    default:
      return null;
  }
}
