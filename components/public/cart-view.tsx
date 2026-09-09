"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { FoodImage } from "@/components/public/food-image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatMoney } from "@/lib/format";
import type { RestaurantSettingsRow } from "@/types/database";

export function CartView({ settings }: { settings: RestaurantSettingsRow }) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is waiting for something delicious."
        description="Explore the menu and add a few dishes to get started."
        action={
          <Link href="/menu" className="btn-order">
            Explore menu
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.lineId} className="brand-card flex gap-4 p-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
              <FoodImage src={item.imageUrl} alt={item.name} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.optionLabels.length > 0 ? (
                    <p className="text-muted-foreground mt-1 text-sm">{item.optionLabels.join(", ")}</p>
                  ) : null}
                </div>
                <p className="font-semibold text-primary">
                  {formatMoney((item.unitPrice + item.optionsTotal) * item.quantity, settings)}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-lg"
                  aria-label={`Decrease ${item.name}`}
                  onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                >
                  <Minus />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-lg"
                  aria-label={`Increase ${item.name}`}
                  onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                >
                  <Plus />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto rounded-lg text-destructive hover:bg-destructive/8"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeItem(item.lineId)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="brand-card h-fit space-y-4 p-5 sm:p-6">
        <h2 className="font-heading text-sm tracking-[0.14em] text-primary uppercase">Order summary</h2>
        <p className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">{formatMoney(subtotal, settings)}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Delivery fee is calculated at checkout. Final prices are confirmed on the server.
        </p>
        <Link href="/checkout" className="btn-order mt-2 w-full">
          Go to checkout
        </Link>
      </aside>
    </div>
  );
}
