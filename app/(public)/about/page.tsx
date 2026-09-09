import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat, Leaf, MapPin, Wheat } from "lucide-react";

import { SectionHeading } from "@/components/public/section-heading";
import { isSupabaseConfigured } from "@/lib/env";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  if (!isSupabaseConfigured) return { title: "About" };
  const settings = await getRestaurantSettings();
  return buildMetadata({
    title: `About | ${settings.restaurant_name}`,
    description: settings.description || `About ${settings.restaurant_name}.`,
    path: "/about",
    settings,
  });
}

export default async function AboutPage() {
  const settings = isSupabaseConfigured ? await getRestaurantSettings() : null;
  const name = settings?.restaurant_name ?? "Hot Bread Beruwala";

  return (
    <div className="py-10 sm:py-16">
      <div className="page-wrap max-w-3xl">
        <SectionHeading eyebrow="Our story" title={`About ${name}`} />
        <p className="mx-auto mt-10 max-w-2xl text-center text-lg leading-relaxed text-foreground/75">
          {settings?.description ||
            "A neighbourhood kitchen in Beruwala, serving food made to order for pickup and delivery. Fresh from the hotplate, made with care."}
        </p>
        {settings?.tagline ? (
          <p className="mt-6 text-center font-script text-2xl text-gold">{settings.tagline}</p>
        ) : null}
      </div>

      <div className="page-wrap mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Wheat, title: "Fresh daily", body: "Every item is baked and prepared the same day." },
          { icon: Leaf, title: "Quality first", body: "We source the best local ingredients." },
          { icon: ChefHat, title: "Handcrafted", body: "Traditional recipes made by hand." },
          { icon: MapPin, title: "Community", body: "Proudly serving Beruwala since day one." },
        ].map((v) => (
          <div key={v.title} className="brand-card group p-6 text-center">
            <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-primary/8 text-primary transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
              <v.icon className="size-6" aria-hidden />
            </span>
            <h3 className="font-heading mt-4 text-sm tracking-[0.14em] text-primary uppercase">{v.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{v.body}</p>
          </div>
        ))}
      </div>

      <div className="page-wrap mt-10 flex justify-center sm:mt-14">
        <Link href="/menu" className="btn-order w-full max-w-xs sm:w-auto">
          Order now
        </Link>
      </div>
    </div>
  );
}
