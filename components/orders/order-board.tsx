"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { OrderCard } from "@/components/orders/order-card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderWithItems } from "@/lib/services/order.service";
import type { OrderStatus, RestaurantSettingsRow, UserRole } from "@/types/database";

const COLUMNS: { id: string; statuses: OrderStatus[] }[] = [
  { id: "NEW", statuses: ["PENDING", "CONFIRMED"] },
  { id: "PREPARING", statuses: ["PREPARING"] },
  { id: "READY", statuses: ["READY"] },
  { id: "OUT", statuses: ["OUT_FOR_DELIVERY"] },
  { id: "DONE", statuses: ["DELIVERED", "PICKED_UP"] },
];

const COLUMN_LABELS: Record<string, string> = {
  NEW: "New",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT: "Out for delivery",
  DONE: "Completed",
};

export function OrderBoard({
  initialOrders,
  role,
  settings,
}: {
  initialOrders: OrderWithItems[];
  role: UserRole;
  settings: RestaurantSettingsRow;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const seen = useRef(new Set(initialOrders.map((order) => order.id)));
  const audioReady = useRef(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("staff-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as OrderWithItems | undefined;
          if (!row?.id) return;
          if (payload.eventType === "INSERT" && !seen.current.has(row.id)) {
            seen.current.add(row.id);
            toast.message(`New order #${row.order_number}`);
            if (audioReady.current) {
              try {
                const audio = new Audio("/sounds/new-order.wav");
                void audio.play();
              } catch {
                // Browsers may block sound until a click.
              }
            }
          }
          setOrders((current) => {
            const previous = current.find((order) => order.id === row.id);
            const without = current.filter((order) => order.id !== row.id);
            return [
              {
                ...previous,
                ...row,
                order_items: row.order_items?.length ? row.order_items : previous?.order_items ?? [],
              },
              ...without,
            ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
        },
      )
      .subscribe();

    const unlock = () => {
      audioReady.current = true;
    };
    window.addEventListener("pointerdown", unlock, { once: true });

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("pointerdown", unlock);
    };
  }, []);

  const columns = useMemo(
    () => (role === "CASHIER" ? COLUMNS.filter((column) => column.id !== "DONE") : COLUMNS),
    [role],
  );

  const grouped = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      orders: orders.filter((order) => column.statuses.includes(order.status)),
    }));
  }, [columns, orders]);

  return (
    <div
      className={
        columns.length >= 5
          ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
          : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      }
    >
      {grouped.map((column) => (
        <section key={column.id} className="min-w-0 rounded-xl bg-black/[0.03] p-3">
          <h2 className="mb-3 flex items-center justify-between gap-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            <span>{COLUMN_LABELS[column.id]}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold tracking-normal text-foreground ring-1 ring-border/80">
              {column.orders.length}
            </span>
          </h2>
          <div className="space-y-3">
            {column.orders.length === 0 ? (
              <p className="text-muted-foreground rounded-xl border border-dashed border-border/80 bg-white/50 px-3 py-8 text-center text-sm">
                No {ORDER_STATUS_LABELS[column.statuses[0]!].toLowerCase()} orders.
              </p>
            ) : (
              column.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  role={role}
                  settings={settings}
                  onUpdated={(patch) => {
                    setOrders((current) =>
                      current.map((item) => (item.id === patch.id ? { ...item, ...patch } : item)),
                    );
                  }}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
