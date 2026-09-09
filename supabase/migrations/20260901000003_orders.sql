-- =============================================================================
-- 0003 — Customers, orders, order history, payments, SMS log and audit trail
-- =============================================================================

-- -----------------------------------------------------------------------------
-- customers — a lightweight contact record. Guests never authenticate; the
-- phone number is the natural key used to recognise repeat customers.
-- -----------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  total_orders integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customers_name_not_blank check (length(trim(name)) > 0),
  constraint customers_phone_not_blank check (length(trim(phone)) > 0),
  constraint customers_total_orders_non_negative check (total_orders >= 0)
);

create index customers_phone_idx on public.customers (phone);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Human readable order numbers (REST-1001, REST-1002, ...)
-- -----------------------------------------------------------------------------

create sequence public.order_number_seq start with 1001 increment by 1;

create or replace function public.generate_order_number()
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_prefix text;
begin
  select order_prefix into v_prefix from public.restaurant_settings limit 1;
  return coalesce(v_prefix, 'REST') || '-' || nextval('public.order_number_seq')::text;
end;
$$;

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  -- Non-guessable public handle used by the customer tracking page. Sequential
  -- ids are never exposed publicly.
  tracking_token text not null unique
    default encode(extensions.gen_random_bytes(24), 'hex'),
  customer_id uuid references public.customers (id) on delete set null,

  order_type public.order_type not null,
  status public.order_status not null default 'PENDING',

  -- Money. Every value here is computed server side from the database and is
  -- never accepted from the browser.
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,

  -- Snapshot of the contact details as given at checkout.
  customer_name text not null,
  customer_phone text not null,
  customer_email text,

  delivery_address text,
  delivery_notes text,
  customer_notes text,

  payment_method public.payment_method not null default 'CASH',
  payment_status public.payment_status not null default 'PENDING',

  assigned_delivery_user_id uuid references public.profiles (id) on delete set null,
  estimated_ready_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  preparing_at timestamptz,
  ready_at timestamptz,
  out_for_delivery_at timestamptz,
  delivered_at timestamptz,
  picked_up_at timestamptz,
  cancelled_at timestamptz,
  completed_by uuid references public.profiles (id) on delete set null,
  cancellation_reason text,

  constraint orders_subtotal_non_negative check (subtotal >= 0),
  constraint orders_discount_non_negative check (discount >= 0),
  constraint orders_delivery_fee_non_negative check (delivery_fee >= 0),
  constraint orders_total_non_negative check (total >= 0),
  constraint orders_customer_name_not_blank check (length(trim(customer_name)) > 0),
  constraint orders_customer_phone_not_blank check (length(trim(customer_phone)) > 0),
  -- A delivery order is meaningless without somewhere to deliver it.
  constraint orders_delivery_requires_address
    check (order_type <> 'DELIVERY' or length(trim(coalesce(delivery_address, ''))) > 0),
  -- Pickup orders must never carry a delivery fee.
  constraint orders_pickup_has_no_delivery_fee
    check (order_type <> 'PICKUP' or delivery_fee = 0),
  constraint orders_cancelled_requires_reason
    check (status <> 'CANCELLED' or length(trim(coalesce(cancellation_reason, ''))) > 0)
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_type_idx on public.orders (order_type);
create index orders_customer_idx on public.orders (customer_id);
create index orders_assigned_delivery_idx
  on public.orders (assigned_delivery_user_id)
  where assigned_delivery_user_id is not null;
create index orders_tracking_token_idx on public.orders (tracking_token);
create index orders_order_number_idx on public.orders (order_number);
create index orders_phone_idx on public.orders (customer_phone);
-- Supports the "active order queue" screens, which are by far the hottest read.
create index orders_active_queue_idx on public.orders (status, created_at desc)
  where status in ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY');
-- Supports revenue/analytics roll-ups over a date range.
create index orders_status_created_at_idx on public.orders (status, created_at);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- order_items — price and name are snapshotted at checkout so that later
-- catalogue edits can never rewrite history.
-- -----------------------------------------------------------------------------

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Kept for reporting. ON DELETE RESTRICT on food_items means a dish that has
  -- been ordered can be deactivated but never physically removed.
  food_item_id uuid references public.food_items (id) on delete restrict,
  item_name text not null,
  unit_price numeric(10, 2) not null,
  options_total numeric(10, 2) not null default 0,
  quantity integer not null,
  line_total numeric(10, 2) not null,
  notes text,
  created_at timestamptz not null default now(),

  constraint order_items_item_name_not_blank check (length(trim(item_name)) > 0),
  constraint order_items_unit_price_non_negative check (unit_price >= 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_quantity_sane check (quantity <= 999),
  constraint order_items_line_total_non_negative check (line_total >= 0)
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_food_item_idx on public.order_items (food_item_id);

-- -----------------------------------------------------------------------------
-- order_item_options — snapshot of every selected add-on.
-- -----------------------------------------------------------------------------

create table public.order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  option_id uuid references public.options (id) on delete set null,
  group_name text not null,
  option_name text not null,
  price_adjustment numeric(10, 2) not null default 0,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),

  constraint order_item_options_group_name_not_blank check (length(trim(group_name)) > 0),
  constraint order_item_options_option_name_not_blank check (length(trim(option_name)) > 0),
  constraint order_item_options_quantity_positive check (quantity > 0)
);

create index order_item_options_order_item_idx
  on public.order_item_options (order_item_id);

-- -----------------------------------------------------------------------------
-- order_status_history — append-only audit trail of the order lifecycle.
-- -----------------------------------------------------------------------------

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  old_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now(),
  notes text
);

create index order_status_history_order_idx
  on public.order_status_history (order_id, changed_at);

-- -----------------------------------------------------------------------------
-- payments — cash only today, but modelled so card/online can be added later.
-- -----------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount numeric(10, 2) not null,
  method public.payment_method not null default 'CASH',
  status public.payment_status not null default 'PENDING',
  collected_by uuid references public.profiles (id) on delete set null,
  collected_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payments_amount_non_negative check (amount >= 0)
);

create index payments_order_idx on public.payments (order_id);
create index payments_status_idx on public.payments (status);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- sms_logs — one row per delivery attempt. Never stores provider credentials.
-- -----------------------------------------------------------------------------

create table public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  phone_number text not null,
  event_type public.sms_event_type not null,
  message text not null,
  provider text,
  status public.sms_status not null default 'PENDING',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index sms_logs_order_idx on public.sms_logs (order_id);
create index sms_logs_created_at_idx on public.sms_logs (created_at desc);
create index sms_logs_status_idx on public.sms_logs (status);

-- -----------------------------------------------------------------------------
-- audit_logs — administrative actions worth being able to explain later.
-- -----------------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint audit_logs_action_not_blank check (length(trim(action)) > 0),
  constraint audit_logs_entity_not_blank check (length(trim(entity)) > 0)
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index audit_logs_profile_idx on public.audit_logs (profile_id);

-- -----------------------------------------------------------------------------
-- rate_limit_hits — backs IP/phone throttling on the public order endpoint.
-- -----------------------------------------------------------------------------

create table public.rate_limit_hits (
  id bigserial primary key,
  bucket text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_hits_lookup_idx
  on public.rate_limit_hits (bucket, identifier, created_at desc);
