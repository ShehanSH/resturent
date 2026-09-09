/**
 * Gateways such as Text.lk want `947166650952`, not `+947166650952`.
 */
export function toGatewayRecipient(phoneNumber: string): string {
  return phoneNumber.replace(/[^\d]/g, "");
}

/** Last four digits only — safe to log. */
export function maskPhone(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length < 4) return "[redacted]";
  return `***${digits.slice(-4)}`;
}
