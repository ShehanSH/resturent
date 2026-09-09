"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/hooks/use-cart";
import { formatMoney } from "@/lib/format";
import type { RestaurantSettingsRow } from "@/types/database";

export function FloatingCartBar({
  settings,
}: {
  settings: Pick<RestaurantSettingsRow, "currency" | "currency_symbol" | "locale">;
}) {
  const pathname = usePathname();
  const { itemCount, subtotal } = useCart();
  const hide =
    pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/order");
  if (hide || itemCount === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Link
        href="/cart"
        className="bg-primary text-primary-foreground pointer-events-auto flex items-center justify-between rounded-2xl px-4 py-3 shadow-[0_16px_40px_-8px_rgba(90,18,28,0.65)] ring-1 ring-white/10 transition-transform active:scale-[0.98]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/12">
            <ShoppingBag className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="text-primary-foreground/75 text-xs">{formatMoney(subtotal, settings)}</span>
          </span>
        </span>
        <span className="ml-3 shrink-0 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold tracking-wide text-primary uppercase shadow-sm">
          View cart
        </span>
      </Link>
    </div>
  );
}
