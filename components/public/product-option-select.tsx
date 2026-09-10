"use client";

import { Check, ChevronDown } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FoodItemDetail } from "@/lib/services/catalog.service";
import type { RestaurantSettingsRow } from "@/types/database";

type OptionGroup = FoodItemDetail["option_groups"][number];

function optionPriceLabel(extra: number, settings: RestaurantSettingsRow) {
  if (extra === 0) return "Included";
  return `${extra > 0 ? "+" : ""}${formatMoney(extra, settings)}`;
}

const triggerClassName = cn(
  "group/select-trigger h-11 w-full min-w-0 rounded-md border border-black/[0.1] bg-white px-3",
  "shadow-[0_1px_2px_rgba(90,18,28,0.04)]",
  "transition-[border-color,box-shadow,background-color] duration-150",
  "hover:border-primary/30 hover:bg-[color-mix(in_oklch,var(--cream),white_78%)]",
  "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15",
  "data-popup-open:border-primary/40 data-popup-open:ring-2 data-popup-open:ring-primary/12",
  "aria-invalid:border-destructive/50 aria-invalid:ring-destructive/15",
);

const menuClassName = cn(
  "rounded-md border border-black/[0.08] bg-white p-1",
  "shadow-[0_10px_28px_-10px_rgba(90,18,28,0.28)] ring-0 duration-150",
);

export function ProductOptionSelect({
  group,
  value,
  settings,
  error,
  onChange,
  id,
}: {
  group: OptionGroup;
  value: string | null;
  settings: RestaurantSettingsRow;
  error?: boolean;
  onChange: (optionId: string) => void;
  id?: string;
}) {
  const labels = Object.fromEntries(group.options.map((option) => [option.id, option.name]));

  return (
    <div className="min-w-0 space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold tracking-[0.1em] text-foreground/65 uppercase"
      >
        {group.name}
        {group.is_required ? (
          <span className="text-destructive ml-0.5" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <Select
        items={labels}
        value={value}
        onValueChange={(next) => {
          if (next == null) return;
          onChange(String(next));
        }}
      >
        <SelectTrigger
          id={id}
          aria-invalid={error || undefined}
          className={triggerClassName}
          icon={
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-popup-open/select-trigger:rotate-180" />
          }
        >
          <SelectValue placeholder="Select" className="min-w-0 flex-1">
            {(selectedValue: string | null) => {
              if (!selectedValue) {
                return <span className="text-muted-foreground font-normal">Select</span>;
              }
              const option = group.options.find((itemOption) => itemOption.id === selectedValue);
              if (!option) return labels[selectedValue] ?? "Select";
              return (
                <span className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <span className="truncate font-medium text-foreground">{option.name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs font-normal tabular-nums">
                    {optionPriceLabel(Number(option.price_adjustment), settings)}
                  </span>
                </span>
              );
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          align="start"
          sideOffset={4}
          alignItemWithTrigger
          positionerClassName="z-[100]"
          className={menuClassName}
        >
          {group.options.map((option) => {
            const extra = Number(option.price_adjustment);
            const isSelected = option.id === value;
            return (
              <SelectItem
                key={option.id}
                value={option.id}
                hideIndicator
                className={cn(
                  "min-h-11 cursor-pointer rounded-md px-2 py-2 text-sm outline-none transition-colors duration-150",
                  "focus-visible:bg-primary/6 data-highlighted:bg-primary/6",
                  isSelected && "bg-primary/8",
                )}
              >
                <span className="grid w-full min-w-0 grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden>
                    {isSelected ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="size-5 rounded-full border border-black/15 bg-white" />
                    )}
                  </span>
                  <span className={cn("min-w-0 truncate font-medium", isSelected && "text-primary")}>
                    {option.name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-right text-xs tabular-nums",
                      isSelected ? "text-primary/70" : "text-muted-foreground",
                    )}
                  >
                    {optionPriceLabel(extra, settings)}
                  </span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
