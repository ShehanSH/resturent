/**
 * Database types.
 *
 * These mirror `supabase/migrations` by hand so the app is fully typed without
 * requiring a live project. After changing a migration, regenerate with:
 *
 *   npm run db:types
 *
 * which overwrites this file from the linked Supabase project.
 */

export type UserRole = "ADMIN" | "CASHIER" | "DELIVERY";

export type OrderType = "PICKUP" | "DELIVERY";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "PICKED_UP"
  | "CANCELLED";

export type PaymentMethod = "CASH";

export type PaymentStatus = "PENDING" | "COLLECTED" | "FAILED" | "REFUNDED";

export type OptionSelectionType = "SINGLE" | "MULTIPLE";

export type SmsEventType =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "ORDER_READY_PICKUP"
  | "ORDER_OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "CAMPAIGN";

export type SmsStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export type BusinessHourEntry = {
  /** 0 = Sunday through 6 = Saturday. */
  day: number;
  is_open: boolean;
  /** 24-hour "HH:mm". */
  opens_at: string;
  closes_at: string;
}

export type RestaurantSettingsRow = {
  id: string;
  is_singleton: boolean;
  restaurant_name: string;
  tagline: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  hero_image_url: string | null;
  currency: string;
  currency_symbol: string;
  locale: string;
  timezone: string;
  default_delivery_fee: number;
  minimum_delivery_order: number;
  order_prefix: string;
  is_accepting_orders: boolean;
  allow_orders_when_closed: boolean;
  default_preparation_time: number;
  business_hours: BusinessHourEntry[];
  facebook_url: string | null;
  instagram_url: string | null;
  whatsapp_number: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export type ProfileRow = {
  id: string;
  auth_user_id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

export type FoodItemRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  preparation_time: number | null;
  display_order: number;
  is_available: boolean;
  is_active: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

export type OptionGroupRow = {
  id: string;
  name: string;
  description: string | null;
  selection_type: OptionSelectionType;
  is_required: boolean;
  min_select: number;
  max_select: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OptionRow = {
  id: string;
  option_group_id: string;
  name: string;
  price_adjustment: number;
  display_order: number;
  is_available: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type FoodItemOptionGroupRow = {
  id: string;
  food_item_id: string;
  option_group_id: string;
  display_order: number;
  created_at: string;
}

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export type OrderRow = {
  id: string;
  order_number: string;
  tracking_token: string;
  customer_id: string | null;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  customer_notes: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  assigned_delivery_user_id: string | null;
  estimated_ready_at: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  picked_up_at: string | null;
  cancelled_at: string | null;
  completed_by: string | null;
  cancellation_reason: string | null;
}

export type OrderItemRow = {
  id: string;
  order_id: string;
  food_item_id: string | null;
  item_name: string;
  unit_price: number;
  options_total: number;
  quantity: number;
  line_total: number;
  notes: string | null;
  created_at: string;
}

export type OrderItemOptionRow = {
  id: string;
  order_item_id: string;
  option_id: string | null;
  group_name: string;
  option_name: string;
  price_adjustment: number;
  quantity: number;
  created_at: string;
}

export type OrderStatusHistoryRow = {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
}

export type PaymentRow = {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  collected_by: string | null;
  collected_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type SmsLogRow = {
  id: string;
  order_id: string | null;
  phone_number: string;
  event_type: SmsEventType;
  message: string;
  provider: string | null;
  status: SmsStatus;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export type AuditLogRow = {
  id: string;
  profile_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Convenience helper: every column is optional on insert when it has a default. */
type Insertable<T, Required extends keyof T> = Partial<T> & Pick<T, Required>;

/**
 * Foreign keys, named as PostgreSQL generates them. postgrest-js reads these to
 * type embedded selects such as `profiles!orders_assigned_delivery_user_id_fkey`.
 */
type Fk<Name extends string, Column extends string, Rel extends string> = {
  foreignKeyName: Name;
  columns: [Column];
  isOneToOne: false;
  referencedRelation: Rel;
  referencedColumns: ["id"];
};

/**
 * Declared as a `type` rather than an `interface` on purpose: postgrest-js
 * matches this against `Record<string, GenericTable>`, and only type aliases
 * receive TypeScript's implicit index signature. As an interface, every query
 * silently resolves to `never`.
 */
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      restaurant_settings: {
        Row: RestaurantSettingsRow;
        Insert: Insertable<RestaurantSettingsRow, never>;
        Update: Partial<RestaurantSettingsRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Insertable<ProfileRow, "auth_user_id" | "full_name">;
        Update: Partial<ProfileRow>;
        Relationships: [Fk<"profiles_auth_user_id_fkey", "auth_user_id", "users">];
      };
      categories: {
        Row: CategoryRow;
        Insert: Insertable<CategoryRow, "name" | "slug">;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      food_items: {
        Row: FoodItemRow;
        Insert: Insertable<FoodItemRow, "category_id" | "name" | "slug" | "price">;
        Update: Partial<FoodItemRow>;
        Relationships: [Fk<"food_items_category_id_fkey", "category_id", "categories">];
      };
      option_groups: {
        Row: OptionGroupRow;
        Insert: Insertable<OptionGroupRow, "name">;
        Update: Partial<OptionGroupRow>;
        Relationships: [];
      };
      options: {
        Row: OptionRow;
        Insert: Insertable<OptionRow, "option_group_id" | "name">;
        Update: Partial<OptionRow>;
        Relationships: [Fk<"options_option_group_id_fkey", "option_group_id", "option_groups">];
      };
      food_item_option_groups: {
        Row: FoodItemOptionGroupRow;
        Insert: Insertable<FoodItemOptionGroupRow, "food_item_id" | "option_group_id">;
        Update: Partial<FoodItemOptionGroupRow>;
        Relationships: [
          Fk<"food_item_option_groups_food_item_id_fkey", "food_item_id", "food_items">,
          Fk<"food_item_option_groups_option_group_id_fkey", "option_group_id", "option_groups">,
        ];
      };
      customers: {
        Row: CustomerRow;
        Insert: Insertable<CustomerRow, "name" | "phone">;
        Update: Partial<CustomerRow>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: Insertable<
          OrderRow,
          "order_number" | "order_type" | "subtotal" | "total" | "customer_name" | "customer_phone"
        >;
        Update: Partial<OrderRow>;
        Relationships: [
          Fk<"orders_customer_id_fkey", "customer_id", "customers">,
          Fk<"orders_assigned_delivery_user_id_fkey", "assigned_delivery_user_id", "profiles">,
          Fk<"orders_completed_by_fkey", "completed_by", "profiles">,
        ];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: Insertable<
          OrderItemRow,
          "order_id" | "item_name" | "unit_price" | "quantity" | "line_total"
        >;
        Update: Partial<OrderItemRow>;
        Relationships: [
          Fk<"order_items_order_id_fkey", "order_id", "orders">,
          Fk<"order_items_food_item_id_fkey", "food_item_id", "food_items">,
        ];
      };
      order_item_options: {
        Row: OrderItemOptionRow;
        Insert: Insertable<OrderItemOptionRow, "order_item_id" | "group_name" | "option_name">;
        Update: Partial<OrderItemOptionRow>;
        Relationships: [
          Fk<"order_item_options_order_item_id_fkey", "order_item_id", "order_items">,
          Fk<"order_item_options_option_id_fkey", "option_id", "options">,
        ];
      };
      order_status_history: {
        Row: OrderStatusHistoryRow;
        Insert: Insertable<OrderStatusHistoryRow, "order_id" | "new_status">;
        Update: Partial<OrderStatusHistoryRow>;
        Relationships: [
          Fk<"order_status_history_order_id_fkey", "order_id", "orders">,
          Fk<"order_status_history_changed_by_fkey", "changed_by", "profiles">,
        ];
      };
      payments: {
        Row: PaymentRow;
        Insert: Insertable<PaymentRow, "order_id" | "amount">;
        Update: Partial<PaymentRow>;
        Relationships: [
          Fk<"payments_order_id_fkey", "order_id", "orders">,
          Fk<"payments_collected_by_fkey", "collected_by", "profiles">,
        ];
      };
      sms_logs: {
        Row: SmsLogRow;
        Insert: Insertable<SmsLogRow, "phone_number" | "event_type" | "message">;
        Update: Partial<SmsLogRow>;
        Relationships: [Fk<"sms_logs_order_id_fkey", "order_id", "orders">];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Insertable<AuditLogRow, "action" | "entity">;
        Update: Partial<AuditLogRow>;
        Relationships: [Fk<"audit_logs_profile_id_fkey", "profile_id", "profiles">];
      };
      rate_limit_hits: {
        Row: { id: number; bucket: string; identifier: string; created_at: string };
        Insert: { bucket: string; identifier: string; created_at?: string };
        Update: Partial<{ bucket: string; identifier: string; created_at: string }>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_restaurant_open: {
        Args: { p_at?: string };
        Returns: boolean;
      };
      create_order: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_customer_email: string | null;
          p_order_type: OrderType;
          p_delivery_address: string | null;
          p_delivery_notes: string | null;
          p_customer_notes: string | null;
          p_items: unknown;
        };
        Returns: OrderRow;
      };
      update_order_status: {
        Args: {
          p_order_id: string;
          p_new_status: OrderStatus;
          p_notes?: string | null;
          p_cancellation_reason?: string | null;
        };
        Returns: OrderRow;
      };
      assign_delivery_user: {
        Args: { p_order_id: string; p_profile_id: string | null };
        Returns: OrderRow;
      };
      collect_order_payment: {
        Args: { p_order_id: string; p_notes?: string | null };
        Returns: PaymentRow;
      };
      get_order_tracking: {
        Args: { p_token: string };
        Returns: unknown;
      };
      cancel_order_by_token: {
        Args: { p_token: string; p_reason?: string | null };
        Returns: OrderRow;
      };
      bootstrap_first_admin: {
        Args: { p_email: string; p_full_name: string };
        Returns: ProfileRow;
      };
      analytics_summary: {
        Args: { p_from: string; p_to: string };
        Returns: unknown;
      };
      analytics_orders_by_hour: {
        Args: { p_from: string; p_to: string };
        Returns: { hour: number; orders: number; revenue: number }[];
      };
      analytics_revenue_trend: {
        Args: { p_from: string; p_to: string };
        Returns: { day: string; orders: number; revenue: number }[];
      };
      analytics_orders_by_category: {
        Args: { p_from: string; p_to: string };
        Returns: { category_name: string; quantity: number; revenue: number }[];
      };
      analytics_top_items: {
        Args: { p_from: string; p_to: string; p_limit?: number };
        Returns: { item_name: string; quantity: number; revenue: number }[];
      };
      analytics_status_distribution: {
        Args: { p_from: string; p_to: string };
        Returns: { status: OrderStatus; orders: number }[];
      };
      analytics_order_type_split: {
        Args: { p_from: string; p_to: string };
        Returns: { order_type: OrderType; orders: number; revenue: number }[];
      };
    };
    Enums: {
      user_role: UserRole;
      order_type: OrderType;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      option_selection_type: OptionSelectionType;
      sms_event_type: SmsEventType;
      sms_status: SmsStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
