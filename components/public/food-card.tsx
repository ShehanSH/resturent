"use client";

import Link from "next/link";
import { Plus, SlidersHorizontal } from "lucide-react";
import { notify } from "@/lib/notify";

import { FoodImage } from "@/components/public/food-image";
import { Price } from "@/components/public/price";
import { useCart } from "@/hooks/use-cart";
import { foodBadge } from "@/lib/brand";
import { productHref } from "@/lib/public-paths";
import { effectiveUnitPrice } from "@/lib/orders/pricing";
import type { FoodItemWithCategory } from "@/lib/services/catalog.service";
import type { RestaurantSettingsRow } from "@/types/database";
import { cn } from "@/lib/utils";

export function FoodCard({
  item,
  settings,
  index = 0,
  from = "/menu",
}: {
  item: FoodItemWithCategory;
  settings: RestaurantSettingsRow;
  index?: number;
  from?: string;
}) {
  const { addItem } = useCart();
  const badge = foodBadge(item);
  const unit = effectiveUnitPrice(Number(item.price), item.discount_price);
  const canQuickAdd = item.is_available && !item.hasOptions;

  function quickAdd(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    addItem({
      foodItemId: item.id,
      slug: item.slug,
      name: item.name,
      imageUrl: item.image_url,
      unitPrice: unit,
      quantity: 1,
      optionIds: [],
      optionLabels: [],
      optionsTotal: 0,
      notes: null,
    });
    notify.success("Added to cart", item.name);
  }

  return (
    <article
      className="brand-card brand-card-hover reveal group overflow-hidden pt-0"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <Link href={productHref(item.slug, from)} className="block focus-visible:outline-none">
        <div className="relative aspect-4/3 overflow-hidden">
          <FoodImage src={item.image_url} alt={item.name} className="group-hover:scale-[1.06]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {badge ? (
            <span className="bg-primary text-primary-foreground absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase shadow-sm">
              {badge}
            </span>
          ) : null}
          {!item.is_available ? (
            <span className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase shadow-sm">
              Unavailable
            </span>
          ) : null}
        </div>
        <div className="space-y-3 p-4">
          <div>
            {item.category?.name ? (
              <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                {item.category.name}
              </p>
            ) : null}
            <h3 className="font-heading mt-1 text-lg tracking-wide text-primary uppercase">{item.name}</h3>
            {item.short_description ? (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed">{item.short_description}</p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <Price
              price={Number(item.price)}
              discountPrice={item.discount_price}
              settings={settings}
              className="text-primary"
            />
            {canQuickAdd ? (
              <button
                type="button"
                onClick={quickAdd}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground",
                  "transition duration-200 hover:bg-[color-mix(in_oklch,var(--primary),black_10%)] hover:shadow-md",
                  "active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-primary/30",
                )}
                aria-label={`Add ${item.name} to cart`}
              >
                <Plus className="size-4" />
                Add
              </button>
            ) : (
              <span className="inline-flex h-10 items-center gap-1.5 rounded-full border border-primary/20 px-3.5 text-sm font-semibold text-primary">
                <SlidersHorizontal className="size-3.5" />
                {item.hasOptions ? "Customise" : "View"}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
