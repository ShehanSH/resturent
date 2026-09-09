-- =============================================================================
-- 0005 — Row Level Security
--
-- Every table is deny-by-default. Anonymous visitors can read published
-- catalogue content and nothing else; staff access is scoped by role; the
-- service role (used only by trusted server code) bypasses RLS entirely.
-- =============================================================================

alter table public.restaurant_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.food_items enable row level security;
alter table public.option_groups enable row level security;
alter table public.options enable row level security;
alter table public.food_item_option_groups enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_options enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.sms_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rate_limit_hits enable row level security;

-- -----------------------------------------------------------------------------
-- restaurant_settings — public read (name, hours, fees), admin write.
-- -----------------------------------------------------------------------------

create policy restaurant_settings_public_read
  on public.restaurant_settings for select
  to anon, authenticated
  using (true);

create policy restaurant_settings_admin_insert
  on public.restaurant_settings for insert
  to authenticated
  with check (public.is_admin());

create policy restaurant_settings_admin_update
  on public.restaurant_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- profiles — you can always see yourself; admins see everyone; cashiers can see
-- delivery riders so they can assign a drop-off. No anonymous access at all.
-- -----------------------------------------------------------------------------

create policy profiles_read
  on public.profiles for select
  to authenticated
  using (
    auth_user_id = (select auth.uid())
    or public.is_admin()
    or (public.has_role(array['CASHIER']::public.user_role[]) and role = 'DELIVERY')
  );

create policy profiles_admin_insert
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

create policy profiles_admin_update
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Catalogue — anonymous visitors only ever see published rows.
-- -----------------------------------------------------------------------------

create policy categories_public_read
  on public.categories for select
  to anon, authenticated
  using (is_active or public.is_staff());

create policy categories_admin_write
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy food_items_public_read
  on public.food_items for select
  to anon, authenticated
  using (
    (
      is_active
      and exists (
        select 1 from public.categories c
        where c.id = food_items.category_id and c.is_active
      )
    )
    or public.is_staff()
  );

create policy food_items_admin_write
  on public.food_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy option_groups_public_read
  on public.option_groups for select
  to anon, authenticated
  using (is_active or public.is_staff());

create policy option_groups_admin_write
  on public.option_groups for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy options_public_read
  on public.options for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.option_groups g
      where g.id = options.option_group_id and g.is_active
    )
    or public.is_staff()
  );

create policy options_admin_write
  on public.options for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy food_item_option_groups_public_read
  on public.food_item_option_groups for select
  to anon, authenticated
  using (true);

create policy food_item_option_groups_admin_write
  on public.food_item_option_groups for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- customers — staff only. Customer records are never exposed publicly.
-- -----------------------------------------------------------------------------

create policy customers_staff_read
  on public.customers for select
  to authenticated
  using (public.has_role(array['ADMIN', 'CASHIER']::public.user_role[]));

create policy customers_admin_write
  on public.customers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- orders
--
-- There is no anonymous SELECT policy. Customers reach their own order through
-- public.get_order_tracking(token), which returns a deliberately narrow view.
-- Writes always go through the SECURITY DEFINER order functions, so no INSERT
-- or UPDATE policy is granted to anyone.
-- -----------------------------------------------------------------------------

create policy orders_staff_read
  on public.orders for select
  to authenticated
  using (
    public.has_role(array['ADMIN', 'CASHIER']::public.user_role[])
    or (
      public.has_role(array['DELIVERY']::public.user_role[])
      and assigned_delivery_user_id = public.current_profile_id()
    )
  );

create policy orders_admin_update
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Order detail tables — visibility mirrors the parent order exactly.
-- -----------------------------------------------------------------------------

create policy order_items_staff_read
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          public.has_role(array['ADMIN', 'CASHIER']::public.user_role[])
          or (
            public.has_role(array['DELIVERY']::public.user_role[])
            and o.assigned_delivery_user_id = public.current_profile_id()
          )
        )
    )
  );

create policy order_item_options_staff_read
  on public.order_item_options for select
  to authenticated
  using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_options.order_item_id
        and (
          public.has_role(array['ADMIN', 'CASHIER']::public.user_role[])
          or (
            public.has_role(array['DELIVERY']::public.user_role[])
            and o.assigned_delivery_user_id = public.current_profile_id()
          )
        )
    )
  );

create policy order_status_history_staff_read
  on public.order_status_history for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (
          public.has_role(array['ADMIN', 'CASHIER']::public.user_role[])
          or (
            public.has_role(array['DELIVERY']::public.user_role[])
            and o.assigned_delivery_user_id = public.current_profile_id()
          )
        )
    )
  );

create policy payments_staff_read
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and (
          public.has_role(array['ADMIN', 'CASHIER']::public.user_role[])
          or (
            public.has_role(array['DELIVERY']::public.user_role[])
            and o.assigned_delivery_user_id = public.current_profile_id()
          )
        )
    )
  );

-- -----------------------------------------------------------------------------
-- Operational logs — admin only, and only ever written by trusted server code.
-- -----------------------------------------------------------------------------

create policy sms_logs_admin_read
  on public.sms_logs for select
  to authenticated
  using (public.is_admin());

create policy audit_logs_admin_read
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

-- rate_limit_hits intentionally has no policy: only the service role touches it.

-- -----------------------------------------------------------------------------
-- Public order tracking
--
-- Returns only what the customer needs to see. Staff names, internal notes,
-- payment metadata and database ids are all withheld.
-- -----------------------------------------------------------------------------

create or replace function public.get_order_tracking(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_items jsonb;
  v_history jsonb;
begin
  if p_token is null or length(p_token) < 32 then
    return null;
  end if;

  select * into v_order from public.orders where tracking_token = p_token;
  if v_order is null then
    return null;
  end if;

  select coalesce(jsonb_agg(item order by item->>'name'), '[]'::jsonb)
  into v_items
  from (
    select jsonb_build_object(
      'name', oi.item_name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'line_total', oi.line_total,
      'notes', oi.notes,
      'options', coalesce((
        select jsonb_agg(jsonb_build_object(
          'group_name', oio.group_name,
          'option_name', oio.option_name,
          'price_adjustment', oio.price_adjustment
        ))
        from public.order_item_options oio
        where oio.order_item_id = oi.id
      ), '[]'::jsonb)
    ) as item
    from public.order_items oi
    where oi.order_id = v_order.id
  ) items;

  select coalesce(jsonb_agg(jsonb_build_object(
    'status', h.new_status,
    'changed_at', h.changed_at
  ) order by h.changed_at), '[]'::jsonb)
  into v_history
  from public.order_status_history h
  where h.order_id = v_order.id;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'order_type', v_order.order_type,
    'status', v_order.status,
    'subtotal', v_order.subtotal,
    'discount', v_order.discount,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'customer_name', v_order.customer_name,
    'delivery_address', v_order.delivery_address,
    'payment_status', v_order.payment_status,
    'estimated_ready_at', v_order.estimated_ready_at,
    'created_at', v_order.created_at,
    'cancellation_reason', v_order.cancellation_reason,
    'items', v_items,
    'history', v_history
  );
end;
$$;

grant execute on function public.get_order_tracking(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Realtime — staff order screens subscribe to these tables. RLS still applies
-- to realtime payloads, so a rider only ever receives their own orders.
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
