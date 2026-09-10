import {
  ORDER_STATUS_TRANSITIONS,
  ROLE_ALLOWED_TRANSITIONS,
} from "@/lib/constants";
import type { OrderStatus, OrderType, PaymentStatus, UserRole } from "@/types/database";

export function isValidStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
  orderType: OrderType,
): boolean {
  return ORDER_STATUS_TRANSITIONS[from][orderType]?.includes(to) ?? false;
}

export function allowedNextStatuses(
  from: OrderStatus,
  orderType: OrderType,
  role: UserRole,
): OrderStatus[] {
  const byType = ORDER_STATUS_TRANSITIONS[from][orderType] ?? [];
  const byRole = ROLE_ALLOWED_TRANSITIONS[role];
  return byType.filter((status) => byRole.includes(status));
}

/** Guests may cancel from the tracking page only before the kitchen confirms. */
export function guestCanCancel(status: OrderStatus): boolean {
  return status === "PENDING";
}

/** Confirmed (or further) orders need a call to the restaurant. */
export function guestNeedsStaffToCancel(status: OrderStatus): boolean {
  return status !== "PENDING" && status !== "CANCELLED" && status !== "DELIVERED" && status !== "PICKED_UP";
}

export function canRoleSetStatus(role: UserRole, status: OrderStatus): boolean {
  return ROLE_ALLOWED_TRANSITIONS[role].includes(status);
}

/** Cash is never collected on a cancelled order. */
export function canCollectOrderPayment(status: OrderStatus, paymentStatus: PaymentStatus): boolean {
  return paymentStatus === "PENDING" && status !== "CANCELLED";
}

