"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { MapPin, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, fieldMessage, inputErrorClass } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { placeOrderAction } from "@/app/actions/checkout";
import { useCart } from "@/hooks/use-cart";
import { formatMoney } from "@/lib/format";
import { deliveryFee, meetsDeliveryMinimum, orderTotal } from "@/lib/orders/pricing";
import { canAcceptOrders } from "@/lib/opening";
import { cn } from "@/lib/utils";
import type { RestaurantSettingsRow } from "@/types/database";

export function CheckoutForm({ settings }: { settings: RestaurantSettingsRow }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [orderType, setOrderType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const accepting = canAcceptOrders(settings);

  function clearError(key: string) {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  const estimate = orderTotal(
    items.map((item) => ({
      unit_price: item.unitPrice,
      quantity: item.quantity,
      options: [{ price_adjustment: item.optionsTotal }],
    })),
    orderType,
    settings,
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepting) {
      notify.error("The restaurant is not accepting orders right now.");
      return;
    }
    if (items.length === 0) {
      notify.error("Your cart is empty.");
      return;
    }
    if (orderType === "DELIVERY" && !meetsDeliveryMinimum(estimate.subtotal, settings)) {
      notify.error(`Delivery orders must be at least ${formatMoney(settings.minimum_delivery_order, settings)}.`);
      return;
    }

    const form = new FormData(event.currentTarget);
    const text = (key: string) => {
      const value = form.get(key);
      return typeof value === "string" ? value : "";
    };
    setPending(true);
    setFieldErrors({});
    const result = await placeOrderAction({
      customer_name: text("customer_name"),
      customer_phone: text("customer_phone"),
      customer_email: text("customer_email"),
      order_type: orderType,
      delivery_address: text("delivery_address"),
      delivery_notes: text("delivery_notes"),
      customer_notes: text("customer_notes"),
      items: items.map((item) => ({
        food_item_id: item.foodItemId,
        quantity: item.quantity,
        option_ids: item.optionIds.filter(Boolean),
        notes: item.notes ?? "",
      })),
    });
    setPending(false);

    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {});
      notify.formError(result);
      return;
    }

    clear();
    router.push(
      `/order/confirmation?number=${encodeURIComponent(result.data.orderNumber)}&token=${encodeURIComponent(result.data.trackingToken)}`,
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_22rem]" noValidate>
      <fieldset
        disabled={!accepting}
        className={cn("min-w-0 space-y-8 border-0 p-0", !accepting && "opacity-60")}
      >
        <legend className="sr-only">Checkout details</legend>
        <fieldset className="brand-card space-y-5 p-5 sm:p-6">
          <h2 className="font-heading text-sm tracking-[0.14em] text-primary uppercase">Your details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <FieldLabel htmlFor="customer_name" required>
                Full name
              </FieldLabel>
              <Input
                id="customer_name"
                name="customer_name"
                autoComplete="name"
                className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "customer_name")), "h-11 rounded-xl")}
                onChange={() => clearError("customer_name")}
              />
              <FieldError message={fieldMessage(fieldErrors, "customer_name")} />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="customer_phone" required>
                Phone
              </FieldLabel>
              <Input
                id="customer_phone"
                name="customer_phone"
                autoComplete="tel"
                placeholder="077 123 4567"
                className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "customer_phone")), "h-11 rounded-xl")}
                onChange={() => clearError("customer_phone")}
              />
              <FieldError message={fieldMessage(fieldErrors, "customer_phone")} />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="customer_email">Email</FieldLabel>
              <Input
                id="customer_email"
                name="customer_email"
                type="email"
                autoComplete="email"
                className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "customer_email")), "h-11 rounded-xl")}
                onChange={() => clearError("customer_email")}
              />
              <FieldError message={fieldMessage(fieldErrors, "customer_email")} />
            </div>
          </div>
        </fieldset>

        <fieldset className="brand-card space-y-5 p-5 sm:p-6">
          <h2 className="font-heading text-sm tracking-[0.14em] text-primary uppercase">Order type</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["PICKUP", "DELIVERY"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 px-5 py-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
                  orderType === type
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent bg-black/[0.02] hover:border-primary/20",
                )}
              >
                <span className={cn(
                  "inline-flex size-10 items-center justify-center rounded-xl",
                  orderType === type ? "bg-primary text-primary-foreground" : "bg-black/[0.04] text-muted-foreground",
                )}>
                  {type === "PICKUP" ? <MapPin className="size-5" /> : <Truck className="size-5" />}
                </span>
                <span className="font-medium">{type === "PICKUP" ? "Pickup" : "Delivery"}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {orderType === "DELIVERY" ? (
          <fieldset className="brand-card space-y-5 p-5 sm:p-6">
            <h2 className="font-heading text-sm tracking-[0.14em] text-primary uppercase">Delivery details</h2>
            <div className="space-y-2">
              <FieldLabel htmlFor="delivery_address" required>
                Delivery address
              </FieldLabel>
              <Textarea
                id="delivery_address"
                name="delivery_address"
                className={cn(
                  "rounded-xl",
                  fieldMessage(fieldErrors, "delivery_address") && "border-destructive/60",
                )}
                onChange={() => clearError("delivery_address")}
              />
              <FieldError message={fieldMessage(fieldErrors, "delivery_address")} />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="delivery_notes">Delivery notes</FieldLabel>
              <Input
                id="delivery_notes"
                name="delivery_notes"
                placeholder="Gate code, landmarks…"
                className="h-11 rounded-xl"
              />
            </div>
          </fieldset>
        ) : null}

        <fieldset className="brand-card space-y-5 p-5 sm:p-6">
          <h2 className="font-heading text-sm tracking-[0.14em] text-primary uppercase">Notes</h2>
          <div className="space-y-2">
            <FieldLabel htmlFor="customer_notes">Order notes</FieldLabel>
            <Textarea id="customer_notes" name="customer_notes" className="rounded-xl" />
          </div>
        </fieldset>
      </fieldset>

      <aside className="brand-card h-fit space-y-4 p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="font-heading text-sm tracking-[0.14em] text-primary uppercase">Summary</h2>
        <div className="space-y-2.5">
          {items.map((item) => (
            <p key={item.lineId} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.quantity} × {item.name}</span>
              <span>{formatMoney((item.unitPrice + item.optionsTotal) * item.quantity, settings)}</span>
            </p>
          ))}
        </div>
        <div className="space-y-2 border-t pt-3">
          <p className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(estimate.subtotal, settings)}</span>
          </p>
          <p className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span>
              {orderType === "DELIVERY"
                ? formatMoney(deliveryFee("DELIVERY", estimate.subtotal, settings), settings)
                : formatMoney(0, settings)}
            </span>
          </p>
        </div>
        <p className="flex justify-between border-t pt-3 text-lg font-semibold">
          <span>Total</span>
          <span className="text-primary">{formatMoney(estimate.total, settings)}</span>
        </p>
        <FieldError message={fieldMessage(fieldErrors, "items")} />
        <p className="text-xs text-muted-foreground">Pay in cash on pickup or delivery.</p>
        <Button
          type="submit"
          size="lg"
          className="w-full rounded-xl"
          disabled={pending || !accepting || items.length === 0}
        >
          {pending ? "Placing order…" : accepting ? "Place order" : "Kitchen closed"}
        </Button>
      </aside>
    </form>
  );
}
