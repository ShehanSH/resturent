# Restaurant management & online ordering

Production-oriented restaurant website and staff operations app.

- **Public site** — guest menu, cart, pickup/delivery checkout, order tracking
- **Admin** — dashboard, catalogue, orders, reports, staff, settings
- **Cashier** — live pickup queue
- **Delivery** — assigned drop-offs and cash collection

Stack: Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui, Supabase (Postgres, Auth, Storage, Realtime).

---

## 1. What you need from Supabase (copy these three)

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings → API**:

| Variable | Where it is | Safe in browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://abcd.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key | **No — server only** |

Also set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` while developing.

SMS can wait. Leave `SMS_PROVIDER=console` until you have a gateway.

---

## 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) (region close to Sri Lanka, e.g. Singapore).
2. Wait until the database is ready.
3. **Authentication → Providers → Email** — leave email/password enabled.
4. **Authentication → URL configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/redirect`
5. **Database → Replication** — enable Realtime for `orders` (the migration also tries to add this).

---

## 3. Apply the database (schema, RLS, seed)

### Option A — SQL Editor (fastest)

1. Open **SQL → New query**.
2. Run the files in `supabase/migrations/` **in filename order** (0001 through 0008).
3. Then run `supabase/seed.sql` for the demo menu (Spice Route Kitchen). Skip this on a real production restaurant if you prefer an empty menu.

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

To load demo dishes locally after push:

```bash
npx supabase db query --linked -f supabase/seed.sql
```

Or paste `supabase/seed.sql` into the SQL Editor.

---

## 4. Create the first admin

1. **Authentication → Users → Add user**
   - Email + password
   - Confirm the user (auto-confirm is fine for the first account)
2. **SQL Editor**, replace the email and name:

```sql
select public.bootstrap_first_admin('you@example.com', 'Owner Name');
```

This only works while **no staff profiles exist**. After that, create cashiers and riders from **Admin → Staff**.

---

## 5. Connect this app (localhost)

In the project folder:

```bash
copy .env.example .env.local
```

Fill in the three Supabase values. Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| URL | Who |
|---|---|
| `/` `/menu` `/cart` `/checkout` | Customers (no login) |
| `/auth/login` | Staff |
| `/admin/dashboard` | ADMIN |
| `/cashier/orders` | CASHIER |
| `/delivery/orders` | DELIVERY |

---

## 6. Storage

Migrations create public buckets:

- `restaurant-assets`
- `category-images`
- `food-images`

Only admins can upload. Menu images are publicly readable.

---

## 7. SMS (optional)

`SMS_PROVIDER=console` logs messages in the terminal.

For a Sri Lankan REST gateway (Text.lk, Notify.lk, …):

```
SMS_PROVIDER=generic
SMS_API_URL=https://your-gateway/api/send
SMS_API_KEY=...
SMS_SENDER_ID=...
```

A failed SMS never fails an order.

---

## 8. Tests

```bash
npm test
```

Covers pricing, delivery fees, order status transitions, slug/SEO helpers.

---

## 9. Later: Vercel

1. Push the repo.
2. Import the project in Vercel.
3. Add the same environment variables (including `NEXT_PUBLIC_SITE_URL` as your live domain).
4. In Supabase Auth URL config, add the Vercel URL as Site URL / redirect.

Do **not** expose `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix.

---

## Architecture notes

- Guest checkout calls `public.create_order` via the service role. Prices, availability and option validity are computed in Postgres. The browser cannot set totals.
- Staff mutations go through `update_order_status`, `assign_delivery_user`, and `collect_order_payment`.
- Public tracking uses `/order/track/<tracking_token>`, not sequential ids.
- Row Level Security is enabled on every table.
