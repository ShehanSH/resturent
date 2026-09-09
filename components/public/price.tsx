import { formatMoney } from "@/lib/format";
import type { RestaurantSettingsRow } from "@/types/database";

export function Price({
  price,
  discountPrice,
  settings,
  className,
}: {
  price: number;
  discountPrice?: number | null;
  settings: Pick<RestaurantSettingsRow, "currency" | "currency_symbol" | "locale">;
  className?: string;
}) {
  const hasDiscount = discountPrice != null && discountPrice > 0 && discountPrice < price;

  return (
    <span className={className}>
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
