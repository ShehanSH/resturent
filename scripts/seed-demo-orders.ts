/**
 * Clears order-related demo data (not the menu) and inserts a 30-day
 * history so dashboard charts look complete for a client demo.
 *
 *   npx tsx scripts/seed-demo-orders.ts
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
  { name: "Mohamed Irfan", phone: "+94771234015" },
  { name: "Piumi Herath", phone: "+94771234016" },
  { name: "Lakshan Cooray", phone: "+94771234017" },
  { name: "Harini Pathirana", phone: "+94771234018" },
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
  category_id: string;
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260910);

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

function localDate(daysAgo: number): { y: number; m: number; d: number; weekday: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const utc = Date.UTC(year, month - 1, day - daysAgo);
  const date = new Date(utc);
  return {
    y: date.getUTCFullYear(),
    m: date.getUTCMonth() + 1,
    d: date.getUTCDate(),
    weekday: date.getUTCDay(),
  };
}

/** Asia/Colombo is UTC+5:30. */
function colomboToIso(y: number, m: number, d: number, hour: number, minute: number): string {
  const utc = Date.UTC(y, m - 1, d, hour, minute) - (5 * 60 + 30) * 60_000;
  return new Date(utc).toISOString();
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function peakHour(): number {
  const roll = rand();
  if (roll < 0.08) return 8 + Math.floor(rand() * 3);
  if (roll < 0.42) return 11 + Math.floor(rand() * 3);
  if (roll < 0.55) return 15 + Math.floor(rand() * 2);
  if (roll < 0.92) return 18 + Math.floor(rand() * 4);
  return 21 + Math.floor(rand() * 2);
}

function ordersForDay(daysAgo: number, weekday: number): number {
  const weekend = weekday === 0 || weekday === 6;
  if (daysAgo === 0) return 11;
  if (daysAgo === 1) return 14;
  if (daysAgo <= 6) return weekend ? 13 : 9;
  return weekend ? 11 : 7;
}

async function wipeOrderData() {
  const { error: smsError } = await admin.from("sms_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (smsError) throw smsError;
  const { error: orderError } = await admin.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (orderError) throw orderError;
  const { error: customerError } = await admin
    .from("customers")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (customerError) throw customerError;
}

async function nextOrderNumber(prefix: string, fallback: number): Promise<string> {
  const { data, error } = await admin.rpc("generate_order_number");
  if (!error && typeof data === "string" && data.length > 0) return data;
  return `${prefix}-${fallback}`;
}

async function main() {
  const [{ data: settings, error: settingsError }, { data: items, error: itemsError }, { data: profiles }] =
    await Promise.all([
      admin.from("restaurant_settings").select("order_prefix, default_delivery_fee, timezone").limit(1).single(),
      admin.from("food_items").select("id, name, price, discount_price, category_id").eq("is_active", true),
      admin.from("profiles").select("id").eq("role", "ADMIN").eq("active", true).limit(1),
    ]);

  if (settingsError) throw settingsError;
  if (itemsError) throw itemsError;
  const menu = (items ?? []) as FoodItem[];
  if (menu.length === 0) throw new Error("No active food items found. Keep the menu before seeding orders.");

  const prefix = settings?.order_prefix ?? "HBB";
  const deliveryFee = Number(settings?.default_delivery_fee ?? 150);
  const staffId = profiles?.[0]?.id ?? null;

  console.log("Clearing previous order, customer, and SMS records…");
  await wipeOrderData();

  const { data: insertedCustomers, error: customerInsertError } = await admin
    .from("customers")
    .insert(CUSTOMERS.map((customer) => ({ ...customer, total_orders: 0 })))
    .select("id, name, phone");
  if (customerInsertError) throw customerInsertError;
  const customers = insertedCustomers ?? [];

  type BuiltOrder = {
    order: Record<string, unknown>;
    lines: { food_item_id: string; item_name: string; unit_price: number; quantity: number; line_total: number }[];
    history: { new_status: string; changed_at: string }[];
    sms: boolean;
    payment: boolean;
  };

  const built: BuiltOrder[] = [];
  let fallbackNumber = 1001;

  for (let daysAgo = 29; daysAgo >= 0; daysAgo -= 1) {
    const day = localDate(daysAgo);
    const count = ordersForDay(daysAgo, day.weekday);
    for (let n = 0; n < count; n += 1) {
      const customer = pick(customers);
      const isDelivery = rand() < 0.42;
      const hour = peakHour();
      const minute = Math.floor(rand() * 56);
      const createdAt = colomboToIso(day.y, day.m, day.d, hour, minute);

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
          options_total: 0,
        });
      }
      const subtotal = Math.round(lines.reduce((sum, line) => sum + line.line_total, 0) * 100) / 100;
      const fee = isDelivery ? deliveryFee : 0;
      const total = Math.round((subtotal + fee) * 100) / 100;

      let status: string;
      let paymentStatus = "COLLECTED";
      if (daysAgo === 0) {
        const live = n % 11;
        if (live === 0) {
          status = "PENDING";
          paymentStatus = "PENDING";
        } else if (live === 1) {
          status = "CONFIRMED";
          paymentStatus = "PENDING";
        } else if (live === 2) {
          status = "PREPARING";
          paymentStatus = "PENDING";
        } else if (live === 3) {
          status = "READY";
        } else if (live === 4 && isDelivery) {
          status = "OUT_FOR_DELIVERY";
        } else if (live === 10) {
          status = "CANCELLED";
          paymentStatus = "PENDING";
        } else {
          status = isDelivery ? "DELIVERED" : "PICKED_UP";
        }
      } else if (daysAgo === 1 && n === 0) {
        status = "CANCELLED";
        paymentStatus = "PENDING";
      } else if (rand() < 0.05) {
        status = "CANCELLED";
        paymentStatus = "PENDING";
      } else {
        status = isDelivery ? "DELIVERED" : "PICKED_UP";
      }

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

      built.push({
        order: {
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
        },
        lines,
        history,
        sms: status !== "CANCELLED",
        payment: paymentStatus === "COLLECTED",
      });
    }
  }

  console.log(`Inserting ${built.length} demo orders…`);

  const counts = new Map<string, number>();
  for (const row of built) {
    const { data: order, error } = await admin.from("orders").insert(row.order).select("id, created_at").single();
    if (error) throw error;
    const orderId = order!.id;

    const { error: linesError } = await admin.from("order_items").insert(
      row.lines.map((line) => ({
        order_id: orderId,
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
      row.history.map((event, index) => ({
        order_id: orderId,
        old_status: index === 0 ? null : row.history[index - 1]!.new_status,
        new_status: event.new_status,
        changed_by: staffId,
        changed_at: event.changed_at,
      })),
    );
    if (historyError) throw historyError;

    if (row.payment) {
      const { error: payError } = await admin.from("payments").insert({
        order_id: orderId,
        amount: row.order.total,
        method: "CASH",
        status: "COLLECTED",
        collected_by: staffId,
        collected_at: row.order.ready_at ?? row.order.created_at,
      });
      if (payError) throw payError;
    }

    if (row.sms) {
      const { error: smsError } = await admin.from("sms_logs").insert({
        order_id: orderId,
        phone_number: row.order.customer_phone,
        event_type: "ORDER_PLACED",
        message: `Hot Bread Beruwala: we received order #${row.order.order_number}.`,
        provider: "console",
        status: "SENT",
        sent_at: row.order.created_at,
        created_at: row.order.created_at,
      });
      if (smsError) throw smsError;
    }

    const phone = String(row.order.customer_phone);
    counts.set(phone, (counts.get(phone) ?? 0) + 1);
  }

  for (const customer of customers) {
    const { error } = await admin
      .from("customers")
      .update({ total_orders: counts.get(customer.phone) ?? 0 })
      .eq("id", customer.id);
    if (error) throw error;
  }

  console.log(`Seeded ${built.length} orders across 30 days (${TZ}). Menu items were left unchanged.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
