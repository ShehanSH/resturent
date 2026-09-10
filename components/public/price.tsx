import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RestaurantSettingsRow } from "@/types/database";

export function Price({
  price,
  discountPrice,
  settings,
  className,
  layout = "inline",
}: {
  price: number;
  discountPrice?: number | null;
  settings: Pick<RestaurantSettingsRow, "currency" | "currency_symbol" | "locale">;
  className?: string;
  layout?: "inline" | "stacked";
}) {
  const hasDiscount = discountPrice != null && discountPrice > 0 && discountPrice < price;

  if (hasDiscount && layout === "stacked") {
    return (
      <span className={cn("inline-flex flex-col items-end gap-0.5 tabular-nums", className)}>
        <span className="font-semibold">{formatMoney(discountPrice, settings)}</span>
        <span className="text-muted-foreground text-sm line-through">{formatMoney(price, settings)}</span>
      </span>
    );
  }

  return (
    <span className={cn("tabular-nums", className)}>
      {hasDiscount ? (
        <>
          <span className="font-semibold">{formatMoney(discountPrice, settings)}</span>{" "}
          <span className="text-muted-foreground text-sm line-through">{formatMoney(price, settings)}</span>
        </>
      ) : (
        <span className="font-semibold">{formatMoney(price, settings)}</span>
      )}
    </span>
  );
}
