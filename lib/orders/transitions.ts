import {
  ORDER_STATUS_TRANSITIONS,
  ROLE_ALLOWED_TRANSITIONS,
} from "@/lib/constants";
import type { OrderStatus, OrderType, UserRole } from "@/types/database";

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

export function canRoleSetStatus(role: UserRole, status: OrderStatus): boolean {
  return ROLE_ALLOWED_TRANSITIONS[role].includes(status);
}
