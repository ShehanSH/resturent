-- Guest cancellation through the public tracking token.
-- Customers may cancel only while the order is still PENDING. After the kitchen
-- confirms, they must call staff; staff keep using update_order_status.

create or replace function public.cancel_order_by_token(
  p_token text,
  p_reason text default null
)
returns public.orders
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_old_status public.order_status;
  v_reason text;
begin
  if p_token is null or length(p_token) < 32 then
    raise exception 'Order not found.' using errcode = 'R0009';
  end if;

  select * into v_order from public.orders where tracking_token = p_token for update;
  if v_order is null then
    raise exception 'Order not found.' using errcode = 'R0009';
  end if;

  if v_order.status = 'CANCELLED' then
    return v_order;
  end if;

  if v_order.status <> 'PENDING' then
    raise exception 'This order has already been confirmed. Please call the restaurant to cancel.'
      using errcode = 'R0010';
  end if;

  v_reason := nullif(trim(coalesce(p_reason, '')), '');
  if v_reason is null then
    v_reason := 'Cancelled by customer';
  end if;

  v_old_status := v_order.status;

  update public.orders
  set status = 'CANCELLED',
      cancelled_at = now(),
      cancellation_reason = v_reason
  where id = v_order.id
  returning * into v_order;

  insert into public.order_status_history (order_id, old_status, new_status, changed_by, notes)
  values (v_order.id, v_old_status, 'CANCELLED', null, 'Cancelled by customer');

  return v_order;
end;
$$;

grant execute on function public.cancel_order_by_token(text, text) to anon, authenticated;
