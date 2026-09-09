-- =============================================================================
-- 0006 — Reporting and analytics
--
-- All aggregation happens in PostgreSQL. The browser never receives raw order
-- rows in order to compute a chart. Every function is gated to ADMIN/CASHIER.
-- Cancelled orders are excluded from revenue but still counted where relevant.
-- =============================================================================

create or replace function public.assert_analytics_access()
returns void
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.has_role(array['ADMIN', 'CASHIER']::public.user_role[]) then
    raise exception 'You are not authorised to view analytics.' using errcode = 'R0008';
  end if;
end;
$$;

grant execute on function public.assert_analytics_access() to authenticated;

-- -----------------------------------------------------------------------------
-- Headline numbers for the dashboard cards.
-- -----------------------------------------------------------------------------

create or replace function public.analytics_summary(
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  perform public.assert_analytics_access();

  select jsonb_build_object(
    'total_orders', count(*),
    'revenue', coalesce(sum(total) filter (where status <> 'CANCELLED'), 0),
    'pending_orders', count(*) filter (where status = 'PENDING'),
    'active_orders', count(*) filter (
      where status in ('CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY')
    ),
    'completed_orders', count(*) filter (where status in ('DELIVERED', 'PICKED_UP')),
    'cancelled_orders', count(*) filter (where status = 'CANCELLED'),
    'pickup_orders', count(*) filter (where order_type = 'PICKUP'),
    'delivery_orders', count(*) filter (where order_type = 'DELIVERY'),
    'items_sold', coalesce((
      select sum(oi.quantity)
      from public.order_items oi
      join public.orders o2 on o2.id = oi.order_id
      where o2.created_at >= p_from and o2.created_at < p_to
        and o2.status <> 'CANCELLED'
    ), 0),
    'average_order_value', coalesce(
      round(
        avg(total) filter (where status <> 'CANCELLED')::numeric,
        2
      ),
      0
    ),
    'uncollected_payments', coalesce(
      sum(total) filter (
        where payment_status = 'PENDING' and status not in ('CANCELLED')
      ),
      0
    )
  )
  into v_result
  from public.orders
  where created_at >= p_from
    and created_at < p_to;

  return v_result;
end;
$$;

grant execute on function public.analytics_summary(timestamptz, timestamptz) to authenticated;

-- -----------------------------------------------------------------------------
-- Order volume across the 24 hours of the day, in the restaurant's timezone.
-- -----------------------------------------------------------------------------

create or replace function public.analytics_orders_by_hour(
  p_from timestamptz,
  p_to timestamptz
)
returns table (hour integer, orders bigint, revenue numeric)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_tz text;
begin
  perform public.assert_analytics_access();
  select timezone into v_tz from public.restaurant_settings limit 1;
  v_tz := coalesce(v_tz, 'UTC');

  return query
  with hours as (select generate_series(0, 23) as hour)
  select
    h.hour,
    count(o.id) as orders,
    coalesce(sum(o.total) filter (where o.status <> 'CANCELLED'), 0)::numeric as revenue
  from hours h
  left join public.orders o
    on extract(hour from (o.created_at at time zone v_tz))::integer = h.hour
   and o.created_at >= p_from
   and o.created_at < p_to
  group by h.hour
  order by h.hour;
end;
$$;

grant execute on function public.analytics_orders_by_hour(timestamptz, timestamptz) to authenticated;

-- -----------------------------------------------------------------------------
-- Daily revenue trend, with empty days filled in so the chart has no gaps.
-- -----------------------------------------------------------------------------

create or replace function public.analytics_revenue_trend(
  p_from timestamptz,
  p_to timestamptz
)
returns table (day date, orders bigint, revenue numeric)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_tz text;
begin
  perform public.assert_analytics_access();
  select timezone into v_tz from public.restaurant_settings limit 1;
  v_tz := coalesce(v_tz, 'UTC');

  return query
  with days as (
    select generate_series(
      (p_from at time zone v_tz)::date,
      (p_to at time zone v_tz)::date - 1,
      interval '1 day'
    )::date as day
  )
  select
    d.day,
    count(o.id) as orders,
    coalesce(sum(o.total) filter (where o.status <> 'CANCELLED'), 0)::numeric as revenue
  from days d
  left join public.orders o
    on (o.created_at at time zone v_tz)::date = d.day
   and o.created_at >= p_from
   and o.created_at < p_to
  group by d.day
  order by d.day;
end;
$$;

grant execute on function public.analytics_revenue_trend(timestamptz, timestamptz) to authenticated;

-- -----------------------------------------------------------------------------
-- Category performance.
-- -----------------------------------------------------------------------------

create or replace function public.analytics_orders_by_category(
  p_from timestamptz,
  p_to timestamptz
)
returns table (category_name text, quantity bigint, revenue numeric)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_analytics_access();

  return query
  select
    coalesce(c.name, 'Uncategorised') as category_name,
    sum(oi.quantity)::bigint as quantity,
    sum(oi.line_total)::numeric as revenue
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  left join public.food_items f on f.id = oi.food_item_id
  left join public.categories c on c.id = f.category_id
  where o.created_at >= p_from
    and o.created_at < p_to
    and o.status <> 'CANCELLED'
  group by coalesce(c.name, 'Uncategorised')
  order by revenue desc;
end;
$$;

grant execute on function public.analytics_orders_by_category(timestamptz, timestamptz) to authenticated;

-- -----------------------------------------------------------------------------
-- Best sellers, ranked by quantity sold.
-- -----------------------------------------------------------------------------

create or replace function public.analytics_top_items(
  p_from timestamptz,
  p_to timestamptz,
  p_limit integer default 10
)
returns table (item_name text, quantity bigint, revenue numeric)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_analytics_access();

  return query
  select
    oi.item_name,
    sum(oi.quantity)::bigint as quantity,
    sum(oi.line_total)::numeric as revenue
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.created_at >= p_from
    and o.created_at < p_to
    and o.status <> 'CANCELLED'
  group by oi.item_name
  order by quantity desc, revenue desc
  limit greatest(coalesce(p_limit, 10), 1);
end;
$$;

grant execute on function public.analytics_top_items(timestamptz, timestamptz, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- Status distribution and pickup/delivery split.
-- -----------------------------------------------------------------------------

create or replace function public.analytics_status_distribution(
  p_from timestamptz,
  p_to timestamptz
)
returns table (status public.order_status, orders bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_analytics_access();

  return query
  select o.status, count(*)::bigint as orders
  from public.orders o
  where o.created_at >= p_from and o.created_at < p_to
  group by o.status
  order by orders desc;
end;
$$;

grant execute on function public.analytics_status_distribution(timestamptz, timestamptz) to authenticated;

create or replace function public.analytics_order_type_split(
  p_from timestamptz,
  p_to timestamptz
)
returns table (order_type public.order_type, orders bigint, revenue numeric)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_analytics_access();

  return query
  select
    o.order_type,
    count(*)::bigint as orders,
    coalesce(sum(o.total) filter (where o.status <> 'CANCELLED'), 0)::numeric as revenue
  from public.orders o
  where o.created_at >= p_from and o.created_at < p_to
  group by o.order_type;
end;
$$;

grant execute on function public.analytics_order_type_split(timestamptz, timestamptz) to authenticated;
