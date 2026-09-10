"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { notify, REQUIRED_FIELDS_MESSAGE } from "@/lib/notify";
import { Check, ChevronDown, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/form-field";
import { ProductOptionSelect } from "@/components/public/product-option-select";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { formatMoney } from "@/lib/format";
import { effectiveUnitPrice, roundMoney } from "@/lib/orders/pricing";
import { cn } from "@/lib/utils";
import type { FoodItemDetail } from "@/lib/services/catalog.service";
import type { RestaurantSettingsRow } from "@/types/database";

type OptionGroup = FoodItemDetail["option_groups"][number];

function optionPriceLabel(extra: number, settings: RestaurantSettingsRow) {
  if (extra === 0) return "Included";
  return `${extra > 0 ? "+" : ""}${formatMoney(extra, settings)}`;
}

function ToppingsGroup({
  group,
  selectedIds,
  settings,
  error,
  onToggle,
}: {
  group: OptionGroup;
  selectedIds: string[];
  settings: RestaurantSettingsRow;
  error?: boolean;
  onToggle: (optionId: string) => void;
}) {
  const collapsible = group.options.length > 4;
  const [open, setOpen] = useState(!collapsible);
  const selectedCount = selectedIds.length;

  return (
    <fieldset className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-[11px] font-semibold tracking-[0.1em] text-foreground/65 uppercase">
          {group.name}
        </legend>
        <span className="text-muted-foreground shrink-0 text-[11px]">
          Optional{group.max_select ? ` · choose up to ${group.max_select}` : ""}
        </span>
      </div>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="text-primary inline-flex items-center gap-1 text-xs font-medium transition-colors duration-200 hover:underline"
          aria-expanded={open}
        >
          {open ? "Hide toppings" : selectedCount > 0 ? `${selectedCount} selected` : "Add toppings"}
          <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
        </button>
      ) : null}
      {open ? (
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-black/[0.08] bg-[color-mix(in_oklch,var(--cream),white_75%)] shadow-[0_1px_2px_rgba(90,18,28,0.04)]",
            error && "border-destructive/40",
          )}
          role="group"
          aria-label={group.name}
        >
          {group.options.map((option, index) => {
            const checked = selectedIds.includes(option.id);
            const extra = Number(option.price_adjustment);
            return (
              <button
                key={option.id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onToggle(option.id)}
                className={cn(
                  "grid h-12 w-full cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)_5.75rem] items-center px-1 text-left text-sm transition-colors duration-200",
                  "hover:bg-primary/[0.04] focus-visible:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:ring-inset",
                  checked && "bg-primary/[0.07]",
                  index > 0 && "border-t border-black/[0.06]",
                )}
              >
                <span className="flex items-center justify-center" aria-hidden>
                  {checked ? (
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="inline-flex size-5 items-center justify-center rounded-full border-2 border-black/15 bg-white" />
                  )}
                </span>
                <span className={cn("truncate font-medium", checked ? "text-primary" : "text-foreground/85")}>
                  {option.name}
                </span>
                <span
                  className={cn(
                    "pr-3 text-right text-xs tabular-nums",
                    checked ? "font-medium text-primary/75" : "text-muted-foreground",
                  )}
                >
                  {optionPriceLabel(extra, settings)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      <FieldError message={error ? "Please choose an option" : undefined} />
    </fieldset>
  );
}

function ProductActions({
  quantity,
  line,
  settings,
  available,
  adding,
  onDecrease,
  onIncrease,
  onAdd,
  layout,
}: {
  quantity: number;
  line: number;
  settings: RestaurantSettingsRow;
  available: boolean;
  adding: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onAdd: () => void;
  layout: "inline" | "stacked";
}) {
  const qtyControl = (
    <div className="flex h-12 shrink-0 items-center rounded-xl border border-black/[0.08] bg-white px-1 shadow-[0_1px_2px_rgba(90,18,28,0.04)]">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 rounded-lg"
        aria-label="Decrease quantity"
        disabled={adding || quantity <= 1}
        onClick={onDecrease}
      >
        <Minus className="size-4" />
      </Button>
      <span className="w-9 text-center text-base font-semibold tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 rounded-lg"
        aria-label="Increase quantity"
        disabled={adding || quantity >= 99}
        onClick={onIncrease}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );

  const priceLabel = (
    <p
      className={cn(
        "font-semibold tabular-nums text-foreground",
        layout === "inline" ? "text-xl" : "text-lg",
      )}
      aria-live="polite"
    >
      {formatMoney(line, settings)}
    </p>
  );

  const addButton = (
    <Button
      type="button"
      size="lg"
      className={cn(
        "h-12 rounded-xl text-sm font-semibold sm:text-base",
        layout === "stacked" ? "w-full" : "min-w-[12rem] flex-1",
      )}
      disabled={!available || adding}
      onClick={onAdd}
    >
      {adding ? "Adding…" : available ? `Add to cart · ${formatMoney(line, settings)}` : "Unavailable"}
    </Button>
  );

  if (layout === "stacked") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          {qtyControl}
          {priceLabel}
        </div>
        {addButton}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
      {qtyControl}
      <div className="ml-auto shrink-0">{priceLabel}</div>
      {addButton}
    </div>
  );
}

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
  const [adding, setAdding] = useState(false);
  const [optionError, setOptionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const group of item.option_groups) {
      const defaults = group.options.filter((option) => option.is_default).map((option) => option.id);
      initial[group.id] = defaults;
    }
    return initial;
  });

  const singleGroups = item.option_groups.filter((group) => group.selection_type === "SINGLE");
  const extraGroups = item.option_groups.filter((group) => group.selection_type === "MULTIPLE");
  const optionIds = useMemo(() => Object.values(selected).flat(), [selected]);
  const selectedOptions = item.option_groups.flatMap((group) =>
    group.options.filter((option) => optionIds.includes(option.id)),
  );
  const optionsTotal = selectedOptions.reduce((sum, option) => sum + Number(option.price_adjustment), 0);
  const unit = effectiveUnitPrice(Number(item.price), item.discount_price);
  const line = roundMoney((unit + optionsTotal) * quantity);
  const selectionSummary = selectedOptions.map((option) => option.name).join(" · ");

  function setSingle(groupId: string, optionId: string) {
    setOptionError((currentError) => (currentError === groupId ? null : currentError));
    setSelected((current) => ({ ...current, [groupId]: [optionId] }));
  }

  function toggleExtra(group: OptionGroup, optionId: string) {
    setOptionError((currentError) => (currentError === group.id ? null : currentError));
    setSelected((current) => {
      const existing = current[group.id] ?? [];
      const next = existing.includes(optionId)
        ? existing.filter((id) => id !== optionId)
        : [...existing, optionId];
      if (group.max_select && next.length > group.max_select) return current;
      return { ...current, [group.id]: next };
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

  async function onAdd() {
    if (adding) return;
    const errorGroup = validate();
    if (errorGroup) {
      setOptionError(errorGroup);
      notify.error(REQUIRED_FIELDS_MESSAGE);
      return;
    }
    setOptionError(null);
    setAdding(true);
    try {
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
      toast.success("Added to cart", {
        description: selectionSummary || item.name,
        duration: 3200,
        className: "toast-success",
        action: {
          label: "View cart",
          onClick: () => router.push("/cart"),
        },
      });
      router.push(returnTo);
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        {singleGroups.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-4">
            {singleGroups.map((group) => (
              <div key={group.id} className="min-w-0">
                <ProductOptionSelect
                  id={`option-${group.id}`}
                  group={group}
                  value={selected[group.id]?.[0] ?? null}
                  settings={settings}
                  error={optionError === group.id}
                  onChange={(optionId) => setSingle(group.id, optionId)}
                />
                <FieldError message={optionError === group.id ? "Please choose an option" : undefined} />
              </div>
            ))}
          </div>
        ) : null}

        {extraGroups.map((group) => (
          <ToppingsGroup
            key={group.id}
            group={group}
            selectedIds={selected[group.id] ?? []}
            settings={settings}
            error={optionError === group.id}
            onToggle={(optionId) => toggleExtra(group, optionId)}
          />
        ))}

        <div className="space-y-1.5 pt-1">
          <label htmlFor="notes" className="block text-[11px] font-semibold tracking-[0.1em] text-foreground/65 uppercase">
            Special instructions
            <span className="text-muted-foreground ml-2 font-sans font-normal tracking-normal normal-case">
              Optional
            </span>
          </label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="No onions, extra gravy…"
            maxLength={280}
            rows={2}
            className="min-h-16 rounded-xl border-black/[0.08] bg-white field-sizing-fixed shadow-[0_1px_2px_rgba(90,18,28,0.03)]"
          />
        </div>

        <div className="hidden border-t border-black/6 pt-4 lg:block">
          <ProductActions
            layout="inline"
            quantity={quantity}
            line={line}
            settings={settings}
            available={item.is_available}
            adding={adding}
            onDecrease={() => setQuantity((value) => Math.max(1, value - 1))}
            onIncrease={() => setQuantity((value) => Math.min(99, value + 1))}
            onAdd={onAdd}
          />
          {selectionSummary ? (
            <p className="text-muted-foreground mt-2 truncate text-xs" title={selectionSummary}>
              {selectionSummary}
            </p>
          ) : null}
        </div>

        <div className="h-28 lg:hidden" aria-hidden />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.08] bg-[color-mix(in_oklch,var(--cream),white_90%)]/95 shadow-[0_-8px_24px_-12px_rgba(90,18,28,0.28)] backdrop-blur-md lg:hidden">
        <div className="page-wrap px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {selectionSummary ? (
            <p className="text-muted-foreground mb-2 truncate text-xs" title={selectionSummary}>
              {selectionSummary}
            </p>
          ) : null}
          <ProductActions
            layout="stacked"
            quantity={quantity}
            line={line}
            settings={settings}
            available={item.is_available}
            adding={adding}
            onDecrease={() => setQuantity((value) => Math.max(1, value - 1))}
            onIncrease={() => setQuantity((value) => Math.min(99, value + 1))}
            onAdd={onAdd}
          />
        </div>
      </div>
    </>
  );
}
