-- =============================================================================
-- 0008 — Production bootstrap
--
-- Creates the single restaurant_settings row (create_order depends on it) and
-- provides a one-shot helper for promoting the very first staff account to
-- ADMIN. This is required data, not demo data.
-- =============================================================================

insert into public.restaurant_settings (
  restaurant_name,
  tagline,
  description,
  address,
  currency,
  currency_symbol,
  locale,
  timezone,
  order_prefix,
  default_preparation_time,
  business_hours
)
select
  'Hot Bread Beruwala',
  'Freshly prepared with the finest ingredients',
  'A neighbourhood kitchen in Beruwala. Freshly prepared with quality ingredients. Made with care. Served with pride.',
  '157/ EF Galle Rd, Beruwala',
  'LKR',
  'Rs.',
  'en-LK',
  'Asia/Colombo',
  'HBB',
  20,
  '[
    {"day": 0, "is_open": true, "opens_at": "08:00", "closes_at": "22:00"},
    {"day": 1, "is_open": true, "opens_at": "08:00", "closes_at": "22:00"},
    {"day": 2, "is_open": true, "opens_at": "08:00", "closes_at": "22:00"},
    {"day": 3, "is_open": true, "opens_at": "08:00", "closes_at": "22:00"},
    {"day": 4, "is_open": true, "opens_at": "08:00", "closes_at": "22:00"},
    {"day": 5, "is_open": true, "opens_at": "08:00", "closes_at": "23:00"},
    {"day": 6, "is_open": true, "opens_at": "08:00", "closes_at": "23:00"}
  ]'::jsonb
where not exists (select 1 from public.restaurant_settings);

-- -----------------------------------------------------------------------------
-- bootstrap_first_admin
--
-- Links an existing Supabase Auth user to an ADMIN profile, but only while no
-- profile exists at all. Once the first administrator is in place this function
-- permanently refuses to run, so it cannot become a privilege escalation path.
-- It is never granted to anon or authenticated; only trusted server code with
-- the service role may call it.
-- -----------------------------------------------------------------------------

create or replace function public.bootstrap_first_admin(
  p_email text,
  p_full_name text
)
returns public.profiles
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_auth_user_id uuid;
  v_profile public.profiles;
begin
  if exists (select 1 from public.profiles) then
    raise exception 'Staff profiles already exist; create further accounts from the admin UI.'
      using errcode = 'R0008';
  end if;

  select id into v_auth_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_auth_user_id is null then
    raise exception 'No Supabase Auth user found for %.', p_email using errcode = 'R0009';
  end if;

  insert into public.profiles (auth_user_id, full_name, role, active)
  values (v_auth_user_id, trim(p_full_name), 'ADMIN', true)
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke execute on function public.bootstrap_first_admin(text, text)
  from public, anon, authenticated;
