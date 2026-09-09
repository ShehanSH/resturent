-- =============================================================================
-- 0002 — Restaurant settings, staff profiles, catalogue and food options
-- =============================================================================

-- -----------------------------------------------------------------------------
-- restaurant_settings (single row)
-- -----------------------------------------------------------------------------

create table public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  -- Guarantees exactly one settings row can ever exist.
  is_singleton boolean not null default true,
  restaurant_name text not null default 'My Restaurant',
  tagline text,
  description text,
  phone text,
  email text,
  address text,
  logo_url text,
  favicon_url text,
  hero_image_url text,
  currency text not null default 'LKR',
  currency_symbol text not null default 'Rs.',
  locale text not null default 'en-LK',
  timezone text not null default 'Asia/Colombo',
  default_delivery_fee numeric(10, 2) not null default 0,
  minimum_delivery_order numeric(10, 2) not null default 0,
  order_prefix text not null default 'REST',
  -- Manual kill switch, independent of the weekly schedule.
  is_accepting_orders boolean not null default true,
  -- When false, ordering is blocked outside of business_hours.
  allow_orders_when_closed boolean not null default false,
  default_preparation_time integer not null default 20,
  -- [{ "day": 0..6 (0 = Sunday), "is_open": bool, "opens_at": "11:00", "closes_at": "22:00" }]
  business_hours jsonb not null default '[]'::jsonb,
  facebook_url text,
  instagram_url text,
  whatsapp_number text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint restaurant_settings_singleton check (is_singleton),
  constraint restaurant_settings_delivery_fee_non_negative check (default_delivery_fee >= 0),
  constraint restaurant_settings_minimum_order_non_negative check (minimum_delivery_order >= 0),
  constraint restaurant_settings_prep_time_positive check (default_preparation_time > 0),
  constraint restaurant_settings_order_prefix_format check (order_prefix ~ '^[A-Z0-9]{2,10}$')
);

create unique index restaurant_settings_singleton_idx
  on public.restaurant_settings (is_singleton);

create trigger restaurant_settings_set_updated_at
  before update on public.restaurant_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- profiles — application data for authenticated staff members
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  role public.user_role not null default 'CASHIER',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_not_blank check (length(trim(full_name)) > 0)
);

create index profiles_role_idx on public.profiles (role);
create index profiles_active_idx on public.profiles (active);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Authorization helpers
--
-- These are SECURITY DEFINER so that RLS policies can read the caller's role
-- without recursively evaluating the policies on `profiles` itself. They are
-- the single source of truth for "who is the caller" across every policy.
-- -----------------------------------------------------------------------------

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.active
  limit 1;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.active
  limit 1;
$$;

create or replace function public.has_role(allowed public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.active
      and p.role = any (allowed)
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_role(array['ADMIN']::public.user_role[]);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_role(array['ADMIN', 'CASHIER', 'DELIVERY']::public.user_role[]);
$$;

revoke execute on function public.current_profile_id() from public;
revoke execute on function public.current_user_role() from public;
revoke execute on function public.has_role(public.user_role[]) from public;
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_staff() from public;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.has_role(public.user_role[]) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_name_not_blank check (length(trim(name)) > 0),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint categories_display_order_non_negative check (display_order >= 0)
);

create index categories_slug_idx on public.categories (slug);
create index categories_active_order_idx
  on public.categories (is_active, display_order, name);
create index categories_featured_idx on public.categories (is_featured) where is_featured;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- food_items
-- -----------------------------------------------------------------------------

create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  price numeric(10, 2) not null,
  discount_price numeric(10, 2),
  image_url text,
  preparation_time integer,
  display_order integer not null default 0,
  is_available boolean not null default true,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint food_items_name_not_blank check (length(trim(name)) > 0),
  constraint food_items_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint food_items_price_positive check (price > 0),
  constraint food_items_discount_price_valid
    check (discount_price is null or (discount_price > 0 and discount_price < price)),
  constraint food_items_prep_time_positive
    check (preparation_time is null or preparation_time > 0),
  constraint food_items_display_order_non_negative check (display_order >= 0)
);

create index food_items_category_idx on public.food_items (category_id);
create index food_items_slug_idx on public.food_items (slug);
create index food_items_active_available_idx
  on public.food_items (is_active, is_available, display_order, name);
create index food_items_featured_idx on public.food_items (is_featured) where is_featured;

create trigger food_items_set_updated_at
  before update on public.food_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Food options / add-ons
--
-- option_groups are reusable across dishes ("Size", "Extra toppings") and are
-- attached to a dish through food_item_option_groups.
-- -----------------------------------------------------------------------------

create table public.option_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  selection_type public.option_selection_type not null default 'SINGLE',
  is_required boolean not null default false,
  min_select integer not null default 0,
  max_select integer,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint option_groups_name_not_blank check (length(trim(name)) > 0),
  constraint option_groups_min_select_non_negative check (min_select >= 0),
  constraint option_groups_max_select_valid
    check (max_select is null or max_select >= greatest(min_select, 1)),
  -- A SINGLE-select group can never accept more than one choice.
  constraint option_groups_single_select_bounds
    check (selection_type <> 'SINGLE' or coalesce(max_select, 1) = 1),
  constraint option_groups_required_min
    check (not is_required or min_select >= 1)
);

create trigger option_groups_set_updated_at
  before update on public.option_groups
  for each row execute function public.set_updated_at();

create table public.options (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references public.option_groups (id) on delete cascade,
  name text not null,
  price_adjustment numeric(10, 2) not null default 0,
  display_order integer not null default 0,
  is_available boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint options_name_not_blank check (length(trim(name)) > 0),
  -- Negative adjustments are allowed (e.g. "no cheese -50") but the resulting
  -- line total is validated separately when an order is created.
  constraint options_price_adjustment_bounds check (price_adjustment > -100000),
  unique (option_group_id, name)
);

create index options_group_idx on public.options (option_group_id, display_order);

create trigger options_set_updated_at
  before update on public.options
  for each row execute function public.set_updated_at();

create table public.food_item_option_groups (
  id uuid primary key default gen_random_uuid(),
  food_item_id uuid not null references public.food_items (id) on delete cascade,
  option_group_id uuid not null references public.option_groups (id) on delete cascade,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),

  unique (food_item_id, option_group_id)
);

create index food_item_option_groups_food_idx
  on public.food_item_option_groups (food_item_id, display_order);
create index food_item_option_groups_group_idx
  on public.food_item_option_groups (option_group_id);
