-- =============================================================================
-- 0001 — Extensions, enums and shared trigger helpers
-- =============================================================================

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

create type public.user_role as enum ('ADMIN', 'CASHIER', 'DELIVERY');

create type public.order_type as enum ('PICKUP', 'DELIVERY');

create type public.order_status as enum (
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'PICKED_UP',
  'CANCELLED'
);

create type public.payment_method as enum ('CASH');

create type public.payment_status as enum ('PENDING', 'COLLECTED', 'FAILED', 'REFUNDED');

-- SINGLE  -> radio style, at most one option may be chosen
-- MULTIPLE-> checkbox style, several options may be chosen
create type public.option_selection_type as enum ('SINGLE', 'MULTIPLE');

create type public.sms_event_type as enum (
  'ORDER_PLACED',
  'ORDER_CONFIRMED',
  'ORDER_READY_PICKUP',
  'ORDER_OUT_FOR_DELIVERY',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED'
);

create type public.sms_status as enum ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- -----------------------------------------------------------------------------
-- Shared triggers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Generic BEFORE UPDATE trigger keeping updated_at in sync.';

-- `unaccent` lives in a contrib extension that is not always enabled. A small
-- fallback keeps slug generation dependency free while still handling the
-- accented characters that realistically show up in a menu.
create or replace function public.unaccent_fallback(value text)
returns text
language sql
immutable
strict
as $$
  select translate(
    value,
    'áàâäãåÁÀÂÄÃÅéèêëÉÈÊËíìîïÍÌÎÏóòôöõÓÒÔÖÕúùûüÚÙÛÜñÑçÇ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUnNcC'
  );
$$;

-- Converts an arbitrary label into a URL safe slug: "Chicken Cheese Burger!"
-- becomes "chicken-cheese-burger".
create or replace function public.slugify(value text)
returns text
language sql
immutable
strict
as $$
  select trim(
    both '-' from
    regexp_replace(
      regexp_replace(lower(public.unaccent_fallback(value)), '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'
    )
  );
$$;
