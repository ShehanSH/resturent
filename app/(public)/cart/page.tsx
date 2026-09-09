import type { Metadata } from "next";

import { CartView } from "@/components/public/cart-view";
import { SectionHeading } from "@/components/public/section-heading";
import { isSupabaseConfigured } from "@/lib/env";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  if (!isSupabaseConfigured) return { title: "Cart", robots: { index: false } };
  const settings = await getRestaurantSettings();
  return buildMetadata({
    title: `Cart | ${settings.restaurant_name}`,
    description: "Review your dishes before checkout.",
    path: "/cart",
    noIndex: true,
    settings,
  });
}

export default async function CartPage() {
  const settings = isSupabaseConfigured
    ? await getRestaurantSettings()
    : {
        currency: "LKR",
        currency_symbol: "Rs.",
        locale: "en-LK",
      };

  return (
    <div className="page-wrap py-10">
      <SectionHeading eyebrow="Your order" title="Cart" />
      <div className="mt-10">
        <CartView settings={settings as Awaited<ReturnType<typeof getRestaurantSettings>>} />
      </div>
    </div>
  );
}
