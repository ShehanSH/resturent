import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  OrderItemOptionRow,
  OrderItemRow,
  OrderRow,
  OrderStatus,
  OrderStatusHistoryRow,
  OrderType,
  PaymentRow,
  ProfileRow,
} from "@/types/database";

/**
 * Order reads for the staff applications. Writes live in the server actions,
 * which call the SECURITY DEFINER database functions so that transitions stay
 * atomic and auditable.
 */

export interface OrderItemWithOptions extends OrderItemRow {
  order_item_options: OrderItemOptionRow[];
}

export interface OrderWithItems extends OrderRow {
  order_items: OrderItemWithOptions[];
}

export interface OrderDetail extends OrderWithItems {
  order_status_history: (OrderStatusHistoryRow & {
    changed_by_profile: Pick<ProfileRow, "id" | "full_name" | "role"> | null;
  })[];
  payments: PaymentRow[];
  assigned_delivery_user: Pick<ProfileRow, "id" | "full_name" | "phone"> | null;
}

const ORDER_WITH_ITEMS_SELECT = `
  *,
  order_items(
    *,
    order_item_options(*)
  )
`;

export interface OrderListQuery {
  statuses?: OrderStatus[];
  orderType?: OrderType;
  search?: string;
  from?: string;
  to?: string;
  assignedTo?: string;
  page?: number;
  pageSize?: number;
}

export async function listOrders(query: OrderListQuery = {}): Promise<{
  orders: OrderWithItems[];
  total: number;
}> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? 25;
  const from = (page - 1) * pageSize;

  let builder = supabase.from("orders").select(ORDER_WITH_ITEMS_SELECT, { count: "exact" });

  if (query.statuses?.length) builder = builder.in("status", query.statuses);
  if (query.orderType) builder = builder.eq("order_type", query.orderType);
  if (query.assignedTo) builder = builder.eq("assigned_delivery_user_id", query.assignedTo);
  if (query.from) builder = builder.gte("created_at", query.from);
  if (query.to) builder = builder.lt("created_at", query.to);

  if (query.search) {
    const term = query.search.replace(/[(),*]/g, " ").trim();
    if (term) {
      builder = builder.or(
        `order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`,
      );
    }
  }

  const { data, error, count } = await builder
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw error;

  return { orders: (data ?? []) as unknown as OrderWithItems[], total: count ?? 0 };
}

/** The live queue used by the admin and cashier boards. */
export async function listActiveOrders(statuses: OrderStatus[]): Promise<OrderWithItems[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .in("status", statuses)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as OrderWithItems[];
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `*,
       order_items(*, order_item_options(*)),
       order_status_history(*, changed_by_profile:profiles!order_status_history_changed_by_fkey(id, full_name, role)),
       payments(*),
       assigned_delivery_user:profiles!orders_assigned_delivery_user_id_fkey(id, full_name, phone)`,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const detail = data as unknown as OrderDetail;
  detail.order_status_history = [...(detail.order_status_history ?? [])].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
  );

  return detail;
}

/** Orders assigned to the signed-in rider. RLS already scopes this. */
export async function listMyDeliveries(profileId: string): Promise<OrderWithItems[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .eq("assigned_delivery_user_id", profileId)
    .in("status", ["READY", "OUT_FOR_DELIVERY"])
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as OrderWithItems[];
}

export async function listRecentDeliveries(
  profileId: string,
  limit = 20,
): Promise<OrderWithItems[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .eq("assigned_delivery_user_id", profileId)
    .in("status", ["DELIVERED", "CANCELLED"])
    .order("delivered_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as OrderWithItems[];
}

export async function listDeliveryRiders(): Promise<Pick<ProfileRow, "id" | "full_name" | "phone">[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("role", "DELIVERY")
    .eq("active", true)
    .order("full_name");

  if (error) throw error;
  return data ?? [];
}

/** Total of an order's line items, used to sanity-check totals in tests. */
export function computeOrderSubtotal(items: OrderItemRow[]): number {
  return items.reduce((sum, item) => sum + Number(item.line_total), 0);
}
