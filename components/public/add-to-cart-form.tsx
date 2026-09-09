"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { notify, REQUIRED_FIELDS_MESSAGE } from "@/lib/notify";
import { Check, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { formatMoney } from "@/lib/format";
import { effectiveUnitPrice, roundMoney } from "@/lib/orders/pricing";
import { cn } from "@/lib/utils";
import type { FoodItemDetail } from "@/lib/services/catalog.service";
import type { RestaurantSettingsRow } from "@/types/database";

export function AddToCartForm({
  item,
  settings,
  returnTo = "/menu",
}: {
  item: FoodItemDetail;
  settings: RestaurantSettingsRow;
  returnTo?: string;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [optionError, setOptionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const group of item.option_groups) {
      const defaults = group.options.filter((option) => option.is_default).map((option) => option.id);
      initial[group.id] = defaults;
    }
    return initial;
  });

  const optionIds = useMemo(() => Object.values(selected).flat(), [selected]);
  const selectedOptions = item.option_groups.flatMap((group) =>
    group.options.filter((option) => optionIds.includes(option.id)),
  );
  const optionsTotal = selectedOptions.reduce((sum, option) => sum + Number(option.price_adjustment), 0);
  const unit = effectiveUnitPrice(Number(item.price), item.discount_price);
  const line = roundMoney((unit + optionsTotal) * quantity);

  function toggle(groupId: string, optionId: string, type: "SINGLE" | "MULTIPLE", maxSelect: number | null) {
    setOptionError((currentError) => (currentError === groupId ? null : currentError));
    setSelected((current) => {
      const existing = current[groupId] ?? [];
      if (type === "SINGLE") return { ...current, [groupId]: [optionId] };
      const next = existing.includes(optionId)
        ? existing.filter((id) => id !== optionId)
        : [...existing, optionId];
      if (maxSelect && next.length > maxSelect) return current;
      return { ...current, [groupId]: next };
    });
  }

  function validate(): string | null {
    for (const group of item.option_groups) {
      const count = selected[group.id]?.length ?? 0;
      if (group.is_required && count < Math.max(group.min_select, 1)) {
        return group.id;
      }
      if (count < group.min_select) return group.id;
    }
    return null;
  }

  function onAdd() {
    const errorGroup = validate();
    if (errorGroup) {
      setOptionError(errorGroup);
      notify.error(REQUIRED_FIELDS_MESSAGE);
      return;
    }
    setOptionError(null);
    addItem({
      foodItemId: item.id,
      slug: item.slug,
      name: item.name,
      imageUrl: item.image_url,
      unitPrice: unit,
      quantity,
      optionIds,
      optionLabels: selectedOptions.map((option) => option.name),
      optionsTotal,
      notes: notes.trim() || null,
    });
    notify.success(`${item.name} added to cart`);
    router.push(returnTo);
  }

  return (
    <div className="space-y-6">
      {item.option_groups.map((group) => (
        <fieldset key={group.id} className="space-y-3">
          <legend className="font-heading text-sm tracking-[0.12em] text-primary uppercase">
            {group.name}
            {group.is_required ? (
              <span className="text-destructive ml-0.5" aria-hidden="true">
                *
              </span>
            ) : null}
          </legend>
          <div className="space-y-2">
            {group.options.map((option) => {
              const checked = selected[group.id]?.includes(option.id) ?? false;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(group.id, option.id, group.selection_type, group.max_select)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left transition-all",
                    checked
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent bg-black/[0.02] hover:border-primary/15",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className={cn(
                      "inline-flex size-6 items-center justify-center rounded-lg transition-colors",
                      checked ? "bg-primary text-primary-foreground" : "bg-black/[0.06]",
                    )}>
                      {checked ? <Check className="size-3.5" /> : null}
                    </span>
                    <span className="font-medium">{option.name}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Number(option.price_adjustment) === 0
                      ? "Included"
                      : `${Number(option.price_adjustment) > 0 ? "+" : ""}${formatMoney(option.price_adjustment, settings)}`}
                  </span>
                </button>
              );
            })}
          </div>
          <FieldError message={optionError === group.id ? "Please choose an option" : undefined} />
        </fieldset>
      ))}

      <div className="space-y-2">
        <FieldLabel htmlFor="notes">Special instructions</FieldLabel>
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="No onions, extra gravy…"
          maxLength={280}
          className="rounded-xl"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-xl"
          aria-label="Decrease quantity"
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-10 text-center text-lg font-semibold" aria-live="polite">
          {quantity}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-xl"
          aria-label="Increase quantity"
          onClick={() => setQuantity((value) => Math.min(99, value + 1))}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full rounded-xl text-base"
        disabled={!item.is_available}
        onClick={onAdd}
      >
        {item.is_available ? `Add to cart · ${formatMoney(line, settings)}` : "Unavailable"}
      </Button>
    </div>
  );
}
