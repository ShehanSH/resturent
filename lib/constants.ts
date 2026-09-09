import type { OrderStatus, OrderType, UserRole } from "@/types/database";

/** Order statuses that are still moving through the kitchen. */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
];

/** Order statuses that can no longer change. */
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = ["DELIVERED", "PICKED_UP", "CANCELLED"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  PICKED_UP: "Picked up",
  CANCELLED: "Cancelled",
};

/**
 * Tailwind classes per status. Colour is always paired with a distinct label so
 * the UI never depends on colour alone to convey state.
 */
export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-900 border-blue-200",
  PREPARING: "bg-indigo-100 text-indigo-900 border-indigo-200",
  READY: "bg-emerald-100 text-emerald-900 border-emerald-200",
  OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-900 border-cyan-200",
  DELIVERED: "bg-neutral-100 text-neutral-700 border-neutral-200",
  PICKED_UP: "bg-neutral-100 text-neutral-700 border-neutral-200",
  CANCELLED: "bg-rose-100 text-rose-900 border-rose-200",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  PICKUP: "Pickup",
  DELIVERY: "Delivery",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  CASHIER: "Cashier",
  DELIVERY: "Delivery rider",
};

/**
 * The order lifecycle, mirroring `is_valid_status_transition` in migration 0004.
 * Kept in sync so the UI can grey out impossible actions, but the database
 * remains the authority.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, Partial<Record<OrderType, OrderStatus[]>>> =
  {
    PENDING: {
      PICKUP: ["CONFIRMED", "CANCELLED"],
      DELIVERY: ["CONFIRMED", "CANCELLED"],
    },
    CONFIRMED: {
      PICKUP: ["PREPARING", "CANCELLED"],
      DELIVERY: ["PREPARING", "CANCELLED"],
    },
    PREPARING: {
      PICKUP: ["READY", "CANCELLED"],
      DELIVERY: ["READY", "CANCELLED"],
    },
    READY: {
      PICKUP: ["PICKED_UP", "CANCELLED"],
      DELIVERY: ["OUT_FOR_DELIVERY", "CANCELLED"],
    },
    OUT_FOR_DELIVERY: {
      DELIVERY: ["DELIVERED", "CANCELLED"],
    },
    DELIVERED: {},
    PICKED_UP: {},
    CANCELLED: {},
  };

/** The ordered timeline shown to customers and staff, per order type. */
export const ORDER_TIMELINE: Record<OrderType, OrderStatus[]> = {
  PICKUP: ["PENDING", "CONFIRMED", "PREPARING", "READY", "PICKED_UP"],
  DELIVERY: ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"],
};

/** Which statuses each role is allowed to set. Mirrors `update_order_status`. */
export const ROLE_ALLOWED_TRANSITIONS: Record<UserRole, OrderStatus[]> = {
  ADMIN: [
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "PICKED_UP",
    "CANCELLED",
  ],
  CASHIER: ["CONFIRMED", "PREPARING", "READY", "PICKED_UP", "CANCELLED"],
  DELIVERY: ["OUT_FOR_DELIVERY", "DELIVERED"],
};

export const STORAGE_BUCKETS = {
  restaurantAssets: "restaurant-assets",
  categoryImages: "category-images",
  foodImages: "food-images",
} as const;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const CART_STORAGE_KEY = "restaurant.cart.v1";

export const DEFAULT_PAGE_SIZE = 20;
