/**
 * Adds today's demo orders without clearing existing history.
 * Use before a client demo so the admin dashboard "Today" view is populated.
 *
 *   npx tsx scripts/seed-today-orders.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

const TZ = "Asia/Colombo";
const TODAY_ORDER_COUNT = 14;

const CUSTOMERS = [
  { name: "Ayesha Fernando", phone: "+94771234001" },
  { name: "Dinesh Perera", phone: "+94771234002" },
  { name: "Ishara Silva", phone: "+94771234003" },
  { name: "Malith Jayawardena", phone: "+94771234004" },
  { name: "Nadeesha Gunasekara", phone: "+94771234005" },
  { name: "Rashmi Wickramasinghe", phone: "+94771234006" },
  { name: "Tharindu Bandara", phone: "+94771234007" },
  { name: "Shanika Rajapaksha", phone: "+94771234008" },
  { name: "Chamara Dissanayake", phone: "+94771234009" },
  { name: "Fathima Rizan", phone: "+94771234010" },
  { name: "Nuwan Amarasinghe", phone: "+94771234011" },
  { name: "Kavindi Mendis", phone: "+94771234012" },
  { name: "Sajith Weerasinghe", phone: "+94771234013" },
  { name: "Dilani Samarakoon", phone: "+94771234014" },
] as const;

const ADDRESSES = [
  "12 Galle Road, Beruwala",
  "45 Beach Road, Beruwala",
  "8 Mosque Road, Beruwala",
  "22 Aluthgama Road, Beruwala",
  "157/EF Galle Rd, Beruwala",
  "3 Station Road, Beruwala",
  "19 Maradana Road, Beruwala",
];

type FoodItem = {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const rand = mulberry32(Number(todayKey.replaceAll("-", "")));

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function pickWeighted<T>(items: T[], weight: (item: T) => number): T {
  const weights = items.map(weight);
  const total = weights.reduce((sum, value) => sum + value, 0);
  let roll = rand() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i]!;
    if (roll <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

function itemWeight(item: FoodItem): number {
  const name = item.name.toLowerCase();
  if (name.includes("kottu") || name.includes("pizza") || name.includes("burger")) return 4;
  if (name.includes("rice") || name.includes("chicken") || name.includes("prawn")) return 3;
  return 1.4;
}

function colomboNow(): { y: number; m: number; d: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), hour: get("hour") % 24, minute: get("minute") };
}

/** Asia/Colombo is UTC+5:30. */
function colomboToIso(y: number, m: number, d: number, hour: number, minute: number): string {
  const utc = Date.UTC(y, m - 1, d, hour, minute) - (5 * 60 + 30) * 60_000;
  return new Date(utc).toISOString();
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function orderSlots(now: ReturnType<typeof colomboNow>, count: number): { hour: number; minute: number }[] {
  const endTotal = Math.max(now.hour * 60 + now.minute - 4, 8 * 60);
  const startTotal = Math.min(7 * 60 + 30, endTotal - count * 6);
  const span = Math.max(endTotal - startTotal, count);
  return Array.from({ length: count }, (_, index) => {
    const total = Math.round(startTotal + (span * index) / Math.max(count - 1, 1));
    return { hour: Math.floor(total / 60), minute: total % 60 };
  });
}

function statusForIndex(index: number, isDelivery: boolean): { status: string; paymentStatus: string } {
  switch (index) {
    case 0:
      return { status: "PENDING", paymentStatus: "PENDING" };
    case 1:
      return { status: "CONFIRMED", paymentStatus: "PENDING" };
    case 2:
    case 3:
      return { status: "PREPARING", paymentStatus: "PENDING" };
    case 4:
    case 5:
      return { status: "READY", paymentStatus: "COLLECTED" };
    case 6:
      return isDelivery
        ? { status: "OUT_FOR_DELIVERY", paymentStatus: "PENDING" }
        : { status: "READY", paymentStatus: "COLLECTED" };
    case 7:
      return { status: "CANCELLED", paymentStatus: "PENDING" };
    default:
      return {
        status: isDelivery ? "DELIVERED" : "PICKED_UP",
        paymentStatus: "COLLECTED",
      };
  }
}

async function nextOrderNumber(prefix: string, fallback: number): Promise<string> {
  const { data, error } = await admin.rpc("generate_order_number");
  if (!error && typeof data === "string" && data.length > 0) return data;
  return `${prefix}-${fallback}`;
}

async function main() {
  const now = colomboNow();
  const dayStart = colomboToIso(now.y, now.m, now.d, 0, 0);
  const dayEnd = colomboToIso(now.y, now.m, now.d + 1, 0, 0);

  const { count: existingToday, error: existingError } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", dayStart)
    .lt("created_at", dayEnd);
  if (existingError) throw existingError;
  if ((existingToday ?? 0) >= TODAY_ORDER_COUNT) {
    console.log(`Today already has ${existingToday} order(s) in ${TZ}. Nothing inserted.`);
    return;
  }

  const [{ data: settings, error: settingsError }, { data: items, error: itemsError }, { data: profiles }] =
    await Promise.all([
      admin.from("restaurant_settings").select("order_prefix, default_delivery_fee").limit(1).single(),
      admin.from("food_items").select("id, name, price, discount_price").eq("is_active", true),
      admin.from("profiles").select("id, role").eq("active", true),
    ]);

  if (settingsError) throw settingsError;
  if (itemsError) throw itemsError;
  const menu = (items ?? []) as FoodItem[];
  if (menu.length === 0) throw new Error("No active food items found.");

  const prefix = settings?.order_prefix ?? "HBB";
  const deliveryFee = Number(settings?.default_delivery_fee ?? 150);
  const staffId = profiles?.find((row) => row.role === "ADMIN")?.id ?? null;
  const riderId = profiles?.find((row) => row.role === "DELIVERY")?.id ?? null;

  const { data: existingCustomers, error: customerReadError } = await admin
    .from("customers")
    .select("id, name, phone, total_orders")
    .in(
      "phone",
      CUSTOMERS.map((customer) => customer.phone),
    );
  if (customerReadError) throw customerReadError;

  const byPhone = new Map((existingCustomers ?? []).map((row) => [row.phone, row]));
  const missing = CUSTOMERS.filter((customer) => !byPhone.has(customer.phone));
  if (missing.length > 0) {
    const { data: inserted, error: customerInsertError } = await admin
      .from("customers")
      .insert(missing.map((customer) => ({ ...customer, total_orders: 0 })))
      .select("id, name, phone, total_orders");
    if (customerInsertError) throw customerInsertError;
    for (const row of inserted ?? []) byPhone.set(row.phone, row);
  }

  const customers = CUSTOMERS.map((customer) => byPhone.get(customer.phone)!);
  const slots = orderSlots(now, TODAY_ORDER_COUNT);
  let fallbackNumber = 4001;
  const counts = new Map<string, number>();

  console.log(`Seeding ${TODAY_ORDER_COUNT} orders for ${todayKey} (${TZ})…`);

  for (let n = 0; n < TODAY_ORDER_COUNT; n += 1) {
    const customer = customers[n % customers.length]!;
    const isDelivery = n === 6 || rand() < 0.4;
    const slot = slots[n]!;
    const createdAt = colomboToIso(now.y, now.m, now.d, slot.hour, slot.minute);
    const { status, paymentStatus } = statusForIndex(n, isDelivery);

    const lineCount = rand() < 0.35 ? 1 : rand() < 0.75 ? 2 : 3;
    const lines = [];
    for (let i = 0; i < lineCount; i += 1) {
      const item = pickWeighted(menu, itemWeight);
      const quantity = rand() < 0.7 ? 1 : rand() < 0.9 ? 2 : 3;
      const unit = Number(item.discount_price ?? item.price);
      lines.push({
        food_item_id: item.id,
        item_name: item.name,
        unit_price: unit,
        quantity,
        line_total: Math.round(unit * quantity * 100) / 100,
      });
    }
    const subtotal = Math.round(lines.reduce((sum, line) => sum + line.line_total, 0) * 100) / 100;
    const fee = isDelivery ? deliveryFee : 0;
    const total = Math.round((subtotal + fee) * 100) / 100;

    const confirmedAt = status === "PENDING" ? null : addMinutes(createdAt, 8);
    const preparingAt = ["PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP"].includes(status)
      ? addMinutes(createdAt, 18)
      : null;
    const readyAt = ["READY", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP"].includes(status)
      ? addMinutes(createdAt, 38)
      : null;
    const outAt = ["OUT_FOR_DELIVERY", "DELIVERED"].includes(status) ? addMinutes(createdAt, 48) : null;
    const deliveredAt = status === "DELIVERED" ? addMinutes(createdAt, 72) : null;
    const pickedUpAt = status === "PICKED_UP" ? addMinutes(createdAt, 50) : null;
    const cancelledAt = status === "CANCELLED" ? addMinutes(createdAt, 20) : null;

    const history: { new_status: string; changed_at: string }[] = [{ new_status: "PENDING", changed_at: createdAt }];
    if (confirmedAt) history.push({ new_status: "CONFIRMED", changed_at: confirmedAt });
    if (preparingAt) history.push({ new_status: "PREPARING", changed_at: preparingAt });
    if (readyAt) history.push({ new_status: "READY", changed_at: readyAt });
    if (outAt) history.push({ new_status: "OUT_FOR_DELIVERY", changed_at: outAt });
    if (deliveredAt) history.push({ new_status: "DELIVERED", changed_at: deliveredAt });
    if (pickedUpAt) history.push({ new_status: "PICKED_UP", changed_at: pickedUpAt });
    if (cancelledAt) history.push({ new_status: "CANCELLED", changed_at: cancelledAt });

    const orderNumber = await nextOrderNumber(prefix, fallbackNumber);
    fallbackNumber += 1;

    const { data: order, error } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        order_type: isDelivery ? "DELIVERY" : "PICKUP",
        status,
        subtotal,
        discount: 0,
        delivery_fee: fee,
        total,
        customer_name: customer.name,
        customer_phone: customer.phone,
        delivery_address: isDelivery ? pick(ADDRESSES) : null,
        payment_method: "CASH",
        payment_status: paymentStatus,
        assigned_delivery_user_id: status === "OUT_FOR_DELIVERY" || status === "DELIVERED" ? riderId : null,
        created_at: createdAt,
        confirmed_at: confirmedAt,
        preparing_at: preparingAt,
        ready_at: readyAt,
        out_for_delivery_at: outAt,
        delivered_at: deliveredAt,
        picked_up_at: pickedUpAt,
        cancelled_at: cancelledAt,
        cancellation_reason: status === "CANCELLED" ? "Customer changed their mind" : null,
        completed_by: ["DELIVERED", "PICKED_UP"].includes(status) ? staffId : null,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: linesError } = await admin.from("order_items").insert(
      lines.map((line) => ({
        order_id: order!.id,
        food_item_id: line.food_item_id,
        item_name: line.item_name,
        unit_price: line.unit_price,
        options_total: 0,
        quantity: line.quantity,
        line_total: line.line_total,
      })),
    );
    if (linesError) throw linesError;

    const { error: historyError } = await admin.from("order_status_history").insert(
      history.map((event, index) => ({
        order_id: order!.id,
        old_status: index === 0 ? null : history[index - 1]!.new_status,
        new_status: event.new_status,
        changed_by: staffId,
        changed_at: event.changed_at,
      })),
    );
    if (historyError) throw historyError;

    if (paymentStatus === "COLLECTED") {
      const { error: payError } = await admin.from("payments").insert({
        order_id: order!.id,
        amount: total,
        method: "CASH",
        status: "COLLECTED",
        collected_by: staffId,
        collected_at: readyAt ?? createdAt,
      });
      if (payError) throw payError;
    }

    if (status !== "CANCELLED") {
      const { error: smsError } = await admin.from("sms_logs").insert({
        order_id: order!.id,
        phone_number: customer.phone,
        event_type: "ORDER_PLACED",
        message: `Hot Bread Beruwala: we received order #${orderNumber}.`,
        provider: "console",
        status: "SENT",
        sent_at: createdAt,
        created_at: createdAt,
      });
      if (smsError) throw smsError;
    }

    counts.set(customer.phone, (counts.get(customer.phone) ?? 0) + 1);
  }

  for (const customer of customers) {
    const extra = counts.get(customer.phone) ?? 0;
    if (!extra) continue;
    const { error } = await admin
      .from("customers")
      .update({ total_orders: Number(customer.total_orders ?? 0) + extra })
      .eq("id", customer.id);
    if (error) throw error;
  }

  console.log(`Added ${TODAY_ORDER_COUNT} orders for today. Open /admin and keep the Today tab.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
