import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, PartyPopper } from "lucide-react";

import { isSupabaseConfigured } from "@/lib/env";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  if (!isSupabaseConfigured) return { title: "Order confirmed", robots: { index: false } };
  const settings = await getRestaurantSettings();
  return buildMetadata({
    title: `Order confirmed | ${settings.restaurant_name}`,
    description: "Your order has been placed.",
    path: "/order/confirmation",
    noIndex: true,
    settings,
  });
}

export default async function ConfirmationPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const number = typeof params.number === "string" ? params.number : "";
  const token = typeof params.token === "string" ? params.token : "";
  const type = typeof params.type === "string" ? params.type : "";

  return (
    <div className="page-wrap max-w-xl py-20 text-center">
      <span className="mx-auto inline-flex size-20 items-center justify-center rounded-3xl bg-primary/10 motion-safe:animate-[hbb-scale-in_0.5s_ease]">
        <CheckCircle2 className="size-10 text-primary" />
      </span>
      <p className="font-script mt-6 text-3xl text-gold">Order received <PartyPopper className="mb-1 inline size-6" /></p>
      <h1 className="font-heading mt-2 text-4xl tracking-wide text-primary uppercase">Thank you!</h1>
      {number ? (
        <p className="mt-5 text-lg">
          Your order number is{" "}
          <span className="inline-flex rounded-xl bg-primary/8 px-4 py-1.5 font-semibold text-primary">{number}</span>
        </p>
      ) : null}
      {type ? (
        <p className="text-muted-foreground mt-2 text-sm capitalize">{type.toLowerCase()}</p>
      ) : null}
      <p className="text-muted-foreground mx-auto mt-5 max-w-md leading-relaxed">
        Pay in cash when you collect or when the rider arrives. We&apos;ll send SMS updates if SMS is configured.
        You can cancel from the tracking page until the kitchen confirms the order.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {token ? (
          <Link href={`/order/track/${token}`} className="btn-order">
            Track order
          </Link>
        ) : null}
        <Link href="/menu" className="btn-order-outline">
          Back to menu
        </Link>
      </div>
    </div>
  );
}
