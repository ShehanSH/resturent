import type { Metadata } from "next";
import Link from "next/link";

import { CheckoutForm } from "@/components/public/checkout-form";
import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/public/section-heading";
import { isSupabaseConfigured } from "@/lib/env";
import { canAcceptOrders, getRestaurantSettings } from "@/lib/services/settings.service";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  if (!isSupabaseConfigured) return { title: "Checkout", robots: { index: false } };
  const settings = await getRestaurantSettings();
  return buildMetadata({
    title: `Checkout | ${settings.restaurant_name}`,
    description: "Place a pickup or delivery order. No account required.",
    path: "/checkout",
    noIndex: true,
    settings,
  });
}

export default async function CheckoutPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Checkout is offline" description="Connect Supabase before taking live orders." />
      </div>
    );
  }

  const settings = await getRestaurantSettings();
  const accepting = canAcceptOrders(settings);

  return (
    <div className="page-wrap py-10">
      <SectionHeading eyebrow="Almost there" title="Checkout" />
      <p className="mt-4 text-center text-sm text-muted-foreground">Guest checkout — no login required. Payment is cash only.</p>
      {!accepting ? (
        <p className="mx-auto mt-6 max-w-lg rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
          The restaurant is closed for orders right now. You can still browse the{" "}
          <Link href="/menu" className="font-medium underline">
            menu
          </Link>
          .
        </p>
      ) : null}
      <div className="mt-10">
        <CheckoutForm settings={settings} />
      </div>
    </div>
  );
}
