import type { OrderStatus, OrderType } from "@/types/database";

export interface AnalyticsSummary {
  total_orders: number;
  revenue: number;
  pending_orders: number;
  active_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pickup_orders: number;
  delivery_orders: number;
  items_sold: number;
  average_order_value: number;
  uncollected_payments: number;
}

export interface DateRangeArgs {
  from: Date;
  to: Date;
}

export interface HourlyPoint {
  hour: number;
  orders: number;
  revenue: number;
}

export interface TrendPoint {
  day: string;
  orders: number;
  revenue: number;
}

export interface CategoryPerformance {
  category_name: string;
  quantity: number;
  revenue: number;
}

export interface ItemPerformance {
  item_name: string;
  quantity: number;
  revenue: number;
}

export interface StatusSlice {
  status: OrderStatus;
  orders: number;
}

export interface TypeSlice {
  order_type: OrderType;
  orders: number;
  revenue: number;
}
