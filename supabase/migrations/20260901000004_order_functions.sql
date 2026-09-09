-- =============================================================================
-- 0004 — Order domain functions
--
-- Order creation and every status transition live here rather than in the
-- application so that they are atomic and so that pricing is always derived
-- from the database. Custom SQLSTATE codes in the R0xxx range let the
-- application map failures onto friendly messages.
--
--   R0001 restaurant is not accepting orders
--   R0002 cart is empty / too large
--   R0003 food item missing or unavailable
--   R0004 invalid option selection
--   R0005 required option group not satisfied
--   R0006 below the delivery minimum
--   R0007 invalid status transition
--   R0008 caller is not permitted to perform this transition
--   R0009 order not found
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Business hours
-- -----------------------------------------------------------------------------

create or replace function public.is_restaurant_open(p_at timestamptz default now())
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_settings public.restaurant_settings;
  v_local timestamp;
  v_dow integer;
  v_time time;
  v_entry jsonb;
begin
  select * into v_settings from public.restaurant_settings limit 1;

  if v_settings is null then
    return false;
  end if;

  if not v_settings.is_accepting_orders then
    return false;
  end if;

  -- No schedule configured means "always open".
  if jsonb_array_length(coalesce(v_settings.business_hours, '[]'::jsonb)) = 0 then
    return true;
  end if;

  v_local := p_at at time zone v_settings.timezone;
  v_dow := extract(dow from v_local)::integer;
  v_time := v_local::time;

  for v_entry in
    select value from jsonb_array_elements(v_settings.business_hours)
  loop
    if (v_entry->>'day')::integer = v_dow then
      if coalesce((v_entry->>'is_open')::boolean, false) = false then
        return false;
      end if;

      -- A closing time earlier than the opening time means the shift runs past
      -- midnight (e.g. 17:00 - 02:00).
      if (v_entry->>'closes_at')::time <= (v_entry->>'opens_at')::time then
        return v_time >= (v_entry->>'opens_at')::time
            or v_time <= (v_entry->>'closes_at')::time;
      end if;

      return v_time >= (v_entry->>'opens_at')::time
         and v_time <= (v_entry->>'closes_at')::time;
    end if;
  end loop;

  return false;
end;
$$;

grant execute on function public.is_restaurant_open(timestamptz) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- create_order
--
-- p_items is [{ food_item_id, quantity, notes, option_ids: [uuid] }]. Prices,
-- delivery fee and totals are all recomputed here; anything the browser sends
-- about money is ignored by construction because there is no parameter for it.
-- -----------------------------------------------------------------------------

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_order_type public.order_type,
  p_delivery_address text,
  p_delivery_notes text,
  p_customer_notes text,
  p_items jsonb
)
returns public.orders
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_settings public.restaurant_settings;
  v_order public.orders;
  v_customer_id uuid;
  v_item jsonb;
  v_food public.food_items;
  v_group record;
  v_option record;
  v_option_ids uuid[];
  v_selected_count integer;
  v_matched_count integer;
  v_quantity integer;
  v_unit_price numeric(10, 2);
  v_options_total numeric(10, 2);
  v_line_total numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_delivery_fee numeric(10, 2) := 0;
  v_discount numeric(10, 2) := 0;
  v_order_item_id uuid;
  v_max_prep integer := 0;
  v_item_count integer;
begin
  select * into v_settings from public.restaurant_settings limit 1;
  if v_settings is null then
    raise exception 'Restaurant settings have not been configured.'
      using errcode = 'R0001';
  end if;

  if not v_settings.allow_orders_when_closed and not public.is_restaurant_open() then
    raise exception 'The restaurant is currently closed and not accepting orders.'
      using errcode = 'R0001';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'No items were supplied.' using errcode = 'R0002';
  end if;

  v_item_count := jsonb_array_length(p_items);
  if v_item_count = 0 then
    raise exception 'Your cart is empty.' using errcode = 'R0002';
  end if;
  if v_item_count > 50 then
    raise exception 'An order cannot contain more than 50 distinct items.'
      using errcode = 'R0002';
  end if;

  if p_order_type = 'DELIVERY' then
    v_delivery_fee := v_settings.default_delivery_fee;
  end if;

  -- Recognise repeat customers by phone without ever requiring an account.
  insert into public.customers (name, phone, email, total_orders)
  values (trim(p_customer_name), trim(p_customer_phone), nullif(trim(coalesce(p_customer_email, '')), ''), 1)
  on conflict (phone) do update
    set name = excluded.name,
        email = coalesce(excluded.email, customers.email),
        total_orders = customers.total_orders + 1,
        updated_at = now()
  returning id into v_customer_id;

  insert into public.orders (
    order_number,
    customer_id,
    order_type,
    status,
    subtotal,
    discount,
    delivery_fee,
    total,
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    delivery_notes,
    customer_notes
  )
  values (
    public.generate_order_number(),
    v_customer_id,
    p_order_type,
    'PENDING',
    0,
    0,
    v_delivery_fee,
    0,
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(coalesce(p_customer_email, '')), ''),
    case when p_order_type = 'DELIVERY'
      then nullif(trim(coalesce(p_delivery_address, '')), '') end,
    case when p_order_type = 'DELIVERY'
      then nullif(trim(coalesce(p_delivery_notes, '')), '') end,
    nullif(trim(coalesce(p_customer_notes, '')), '')
  )
  returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);
    if v_quantity < 1 or v_quantity > 99 then
      raise exception 'Quantity must be between 1 and 99.' using errcode = 'R0002';
    end if;

    select * into v_food
    from public.food_items
    where id = (v_item->>'food_item_id')::uuid
      and is_active
      and is_available;

    if v_food is null then
      raise exception 'One of the items in your cart is no longer available.'
        using errcode = 'R0003';
    end if;

    -- The database decides the price, always.
    v_unit_price := coalesce(v_food.discount_price, v_food.price);
    v_max_prep := greatest(
      v_max_prep,
      coalesce(v_food.preparation_time, v_settings.default_preparation_time)
    );

    v_option_ids := coalesce(
      (select array_agg(value::uuid)
       from jsonb_array_elements_text(coalesce(v_item->'option_ids', '[]'::jsonb))),
      '{}'::uuid[]
    );
    v_selected_count := coalesce(array_length(v_option_ids, 1), 0);

    v_options_total := 0;

    if v_selected_count > 0 then
      -- Every selected option must be available and must genuinely belong to a
      -- group attached to this dish. This closes the door on a tampered client
      -- attaching a cheap option from an unrelated product.
      select count(*), coalesce(sum(o.price_adjustment), 0)
      into v_matched_count, v_options_total
      from public.options o
      join public.option_groups g on g.id = o.option_group_id
      join public.food_item_option_groups fig
        on fig.option_group_id = g.id and fig.food_item_id = v_food.id
      where o.id = any (v_option_ids)
        and o.is_available
        and g.is_active;

      if v_matched_count <> v_selected_count then
        raise exception 'An option you selected is not valid for %.', v_food.name
          using errcode = 'R0004';
      end if;
    end if;

    -- Enforce required groups and min/max selection counts.
    for v_group in
      select g.id, g.name, g.is_required, g.min_select, g.max_select, g.selection_type
      from public.option_groups g
      join public.food_item_option_groups fig on fig.option_group_id = g.id
      where fig.food_item_id = v_food.id
        and g.is_active
    loop
      select count(*) into v_matched_count
      from public.options o
      where o.option_group_id = v_group.id
        and o.id = any (v_option_ids);

      if v_group.is_required and v_matched_count < greatest(v_group.min_select, 1) then
        raise exception 'Please choose % for %.', v_group.name, v_food.name
          using errcode = 'R0005';
      end if;

      if v_matched_count < v_group.min_select then
        raise exception 'Please choose at least % option(s) for % on %.',
          v_group.min_select, v_group.name, v_food.name
          using errcode = 'R0005';
      end if;

      if v_group.max_select is not null and v_matched_count > v_group.max_select then
        raise exception 'You can choose at most % option(s) for % on %.',
          v_group.max_select, v_group.name, v_food.name
          using errcode = 'R0004';
      end if;

      if v_group.selection_type = 'SINGLE' and v_matched_count > 1 then
        raise exception 'Only one % may be selected for %.', v_group.name, v_food.name
          using errcode = 'R0004';
      end if;
    end loop;

    v_line_total := (v_unit_price + v_options_total) * v_quantity;
    if v_line_total < 0 then
      raise exception 'Invalid pricing for %.', v_food.name using errcode = 'R0004';
    end if;

    insert into public.order_items (
      order_id, food_item_id, item_name, unit_price, options_total,
      quantity, line_total, notes
    )
    values (
      v_order.id, v_food.id, v_food.name, v_unit_price, v_options_total,
      v_quantity, v_line_total, nullif(trim(coalesce(v_item->>'notes', '')), '')
    )
    returning id into v_order_item_id;

    -- Snapshot the option names and prices alongside the line item.
    if v_selected_count > 0 then
      for v_option in
        select o.id, o.name as option_name, o.price_adjustment, g.name as group_name
        from public.options o
        join public.option_groups g on g.id = o.option_group_id
        where o.id = any (v_option_ids)
        order by g.display_order, o.display_order
      loop
        insert into public.order_item_options (
          order_item_id, option_id, group_name, option_name, price_adjustment, quantity
        )
        values (
          v_order_item_id, v_option.id, v_option.group_name,
          v_option.option_name, v_option.price_adjustment, 1
        );
      end loop;
    end if;

    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if p_order_type = 'DELIVERY' and v_subtotal < v_settings.minimum_delivery_order then
    raise exception 'Delivery orders must be at least %.', v_settings.minimum_delivery_order
      using errcode = 'R0006';
  end if;

  update public.orders
  set subtotal = v_subtotal,
      discount = v_discount,
      delivery_fee = v_delivery_fee,
      total = v_subtotal - v_discount + v_delivery_fee,
      estimated_ready_at = now() + make_interval(
        mins => greatest(v_max_prep, v_settings.default_preparation_time)
      )
  where id = v_order.id
  returning * into v_order;

  insert into public.order_status_history (order_id, old_status, new_status, notes)
  values (v_order.id, null, 'PENDING', 'Order placed by customer');

  insert into public.payments (order_id, amount, method, status)
  values (v_order.id, v_order.total, 'CASH', 'PENDING');

  return v_order;
end;
$$;

-- Deliberately NOT granted to anon/authenticated. Guest checkout runs through a
-- server action using the service role, which adds rate limiting and input
-- validation before this function is ever reached.
revoke execute on function public.create_order(
  text, text, text, public.order_type, text, text, text, jsonb
) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Status transition rules
-- -----------------------------------------------------------------------------

create or replace function public.is_valid_status_transition(
  p_from public.order_status,
  p_to public.order_status,
  p_order_type public.order_type
)
returns boolean
language sql
immutable
as $$
  select case p_from
    when 'PENDING' then p_to in ('CONFIRMED', 'CANCELLED')
    when 'CONFIRMED' then p_to in ('PREPARING', 'CANCELLED')
    when 'PREPARING' then p_to in ('READY', 'CANCELLED')
    when 'READY' then
      case p_order_type
        when 'PICKUP' then p_to in ('PICKED_UP', 'CANCELLED')
        when 'DELIVERY' then p_to in ('OUT_FOR_DELIVERY', 'CANCELLED')
        else false
      end
    when 'OUT_FOR_DELIVERY' then p_to in ('DELIVERED', 'CANCELLED')
    -- DELIVERED, PICKED_UP and CANCELLED are terminal.
    else false
  end;
$$;

grant execute on function public.is_valid_status_transition(
  public.order_status, public.order_status, public.order_type
) to authenticated;

-- -----------------------------------------------------------------------------
-- update_order_status
-- -----------------------------------------------------------------------------

create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status public.order_status,
  p_notes text default null,
  p_cancellation_reason text default null
)
returns public.orders
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_actor_id uuid;
  v_actor_role public.user_role;
  v_allowed boolean;
  v_old_status public.order_status;
begin
  v_actor_id := public.current_profile_id();
  v_actor_role := public.current_user_role();

  if v_actor_id is null or v_actor_role is null then
    raise exception 'You are not authorised to update orders.' using errcode = 'R0008';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order is null then
    raise exception 'Order not found.' using errcode = 'R0009';
  end if;

  if not public.is_valid_status_transition(v_order.status, p_new_status, v_order.order_type) then
    raise exception 'Cannot move order from % to %.', v_order.status, p_new_status
      using errcode = 'R0007';
  end if;

  -- Role gate. Delivery riders are additionally scoped to their own orders.
  v_allowed := case v_actor_role
    when 'ADMIN' then true
    when 'CASHIER' then p_new_status in
      ('CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED')
    when 'DELIVERY' then p_new_status in ('OUT_FOR_DELIVERY', 'DELIVERED')
      and v_order.assigned_delivery_user_id = v_actor_id
    else false
  end;

  if not v_allowed then
    raise exception 'Your role cannot move an order to %.', p_new_status
      using errcode = 'R0008';
  end if;

  if p_new_status = 'CANCELLED'
     and length(trim(coalesce(p_cancellation_reason, ''))) = 0 then
    raise exception 'A cancellation reason is required.' using errcode = 'R0007';
  end if;

  v_old_status := v_order.status;

  update public.orders
  set status = p_new_status,
      confirmed_at = case when p_new_status = 'CONFIRMED' then now() else confirmed_at end,
      preparing_at = case when p_new_status = 'PREPARING' then now() else preparing_at end,
      ready_at = case when p_new_status = 'READY' then now() else ready_at end,
      out_for_delivery_at = case when p_new_status = 'OUT_FOR_DELIVERY'
        then now() else out_for_delivery_at end,
      delivered_at = case when p_new_status = 'DELIVERED' then now() else delivered_at end,
      picked_up_at = case when p_new_status = 'PICKED_UP' then now() else picked_up_at end,
      cancelled_at = case when p_new_status = 'CANCELLED' then now() else cancelled_at end,
      cancellation_reason = case when p_new_status = 'CANCELLED'
        then trim(p_cancellation_reason) else cancellation_reason end,
      completed_by = case when p_new_status in ('DELIVERED', 'PICKED_UP', 'CANCELLED')
        then v_actor_id else completed_by end
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (order_id, old_status, new_status, changed_by, notes)
  values (
    p_order_id,
    v_old_status,
    p_new_status,
    v_actor_id,
    nullif(trim(coalesce(p_notes, '')), '')
  );

  return v_order;
end;
$$;

grant execute on function public.update_order_status(
  uuid, public.order_status, text, text
) to authenticated;

-- -----------------------------------------------------------------------------
-- assign_delivery_user
-- -----------------------------------------------------------------------------

create or replace function public.assign_delivery_user(
  p_order_id uuid,
  p_profile_id uuid
)
returns public.orders
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
begin
  if not public.has_role(array['ADMIN', 'CASHIER']::public.user_role[]) then
    raise exception 'You are not authorised to assign deliveries.' using errcode = 'R0008';
  end if;

  if p_profile_id is not null and not exists (
    select 1 from public.profiles
    where id = p_profile_id and role = 'DELIVERY' and active
  ) then
    raise exception 'The selected user is not an active delivery rider.'
      using errcode = 'R0008';
  end if;

  update public.orders
  set assigned_delivery_user_id = p_profile_id
  where id = p_order_id
    and order_type = 'DELIVERY'
  returning * into v_order;

  if v_order is null then
    raise exception 'Delivery order not found.' using errcode = 'R0009';
  end if;

  return v_order;
end;
$$;

grant execute on function public.assign_delivery_user(uuid, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- collect_order_payment
--
-- There is deliberately no amount parameter: the figure always comes from the
-- order itself so a rider can never alter what is owed.
-- -----------------------------------------------------------------------------

create or replace function public.collect_order_payment(
  p_order_id uuid,
  p_notes text default null
)
returns public.payments
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_payment public.payments;
  v_actor_id uuid;
  v_actor_role public.user_role;
begin
  v_actor_id := public.current_profile_id();
  v_actor_role := public.current_user_role();

  if v_actor_id is null then
    raise exception 'You are not authorised to collect payments.' using errcode = 'R0008';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order is null then
    raise exception 'Order not found.' using errcode = 'R0009';
  end if;

  if v_actor_role = 'DELIVERY' and v_order.assigned_delivery_user_id is distinct from v_actor_id then
    raise exception 'This delivery is not assigned to you.' using errcode = 'R0008';
  end if;

  if v_order.status = 'CANCELLED' then
    raise exception 'Payment cannot be collected for a cancelled order.'
      using errcode = 'R0007';
  end if;

  update public.payments
  set status = 'COLLECTED',
      amount = v_order.total,
      collected_by = v_actor_id,
      collected_at = now(),
      notes = nullif(trim(coalesce(p_notes, '')), '')
  where order_id = p_order_id
  returning * into v_payment;

  if v_payment is null then
    insert into public.payments (order_id, amount, method, status, collected_by, collected_at, notes)
    values (p_order_id, v_order.total, 'CASH', 'COLLECTED', v_actor_id, now(),
            nullif(trim(coalesce(p_notes, '')), ''))
    returning * into v_payment;
  end if;

  update public.orders set payment_status = 'COLLECTED' where id = p_order_id;

  return v_payment;
end;
$$;

grant execute on function public.collect_order_payment(uuid, text) to authenticated;
