import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bike, ChefHat, Leaf, MapPin, ShoppingBag, Wheat } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { FoodImage } from "@/components/public/food-image";
import { Price } from "@/components/public/price";
import { SectionHeading } from "@/components/public/section-heading";
import { brandHeroSrc, BRAND_DELIVERY_SRC } from "@/lib/brand";
import { isSupabaseConfigured } from "@/lib/env";
import { productHref } from "@/lib/public-paths";
import { listMenuItems } from "@/lib/services/catalog.service";
import { canAcceptOrders, getRestaurantSettings } from "@/lib/services/settings.service";
import { buildMetadata, restaurantJsonLd, websiteJsonLd } from "@/lib/seo";
import type { FoodItemWithCategory } from "@/lib/services/catalog.service";
import type { RestaurantSettingsRow } from "@/types/database";

export async function generateMetadata(): Promise<Metadata> {
  if (!isSupabaseConfigured) {
    return { title: "Hot Bread Beruwala", robots: { index: false } };
  }
  const settings = await getRestaurantSettings();
  const title = settings.seo_title || `${settings.restaurant_name} | Order online`;
  return {
    ...buildMetadata({
      title,
      description:
        settings.seo_description ||
        settings.description ||
        `Order pickup or delivery from ${settings.restaurant_name}.`,
      path: "/",
      image: settings.hero_image_url || "/brand/hero-biryani.png",
      settings,
    }),
    title: { absolute: title },
  };
}

export default async function HomePage() {
  if (!isSupabaseConfigured) {
    return (
      <section className="page-wrap py-24 text-center">
        <p className="font-script text-gold text-3xl">Freshly baked</p>
        <h1 className="font-heading mt-4 text-5xl text-primary uppercase">Hot Bread Beruwala</h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Add your Supabase keys to <code className="bg-muted rounded px-1.5 py-0.5 text-sm">.env.local</code>{" "}
          and the live menu will appear here.
        </p>
      </section>
    );
  }

  const settings = await getRestaurantSettings();
  const featured = await listMenuItems({ featuredOnly: true, limit: 5 });
  const popular = featured.length ? featured : await listMenuItems({ limit: 5 });
  const accepting = canAcceptOrders(settings);
  const heroSrc = brandHeroSrc(settings.hero_image_url);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd(settings)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd(settings)) }} />

      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] overflow-hidden bg-cocoa text-white">
        <Image
          src={heroSrc}
          alt="Hot Bread Beruwala signature dish"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-black/10" />
        <div className="page-wrap relative flex min-h-[100svh] flex-col justify-center py-28">
          <div className="max-w-xl">
            <p className="font-script text-3xl text-gold sm:text-4xl">
              {settings.tagline || "Freshly Baked. Always Delicious."}
            </p>
            <h1 className="font-heading mt-4 text-5xl leading-[0.9] tracking-[0.06em] uppercase sm:text-6xl lg:text-7xl">
              Hot Bread
              <span className="mt-1 block text-primary">Beruwala</span>
            </h1>
            <span className="mt-6 inline-flex items-center gap-3" aria-hidden>
              <span className="h-px w-12 bg-gold/60" />
              <span className="size-1.5 rounded-full bg-gold" />
              <span className="h-px w-12 bg-gold/60" />
            </span>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              {settings.description ||
                "Freshly prepared with quality ingredients. Made with care. Served with pride."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu" className="btn-order">
                <ShoppingBag className="size-4" />
                Order now
              </Link>
              <Link href="/menu" className="btn-order-light">
                View menu
              </Link>
            </div>
            {!accepting ? (
              <p className="mt-6 max-w-md rounded-xl border border-amber-300/30 bg-black/40 px-4 py-3 text-sm text-amber-100 backdrop-blur-sm">
                Online ordering is paused right now. You can still browse the menu.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="page-wrap grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Value icon={Wheat} title="Freshly baked" body="Warm from the oven, prepared for every order." />
          <Value icon={Leaf} title="Quality ingredients" body="Simple, honest ingredients we are proud to serve." />
          <Value icon={ChefHat} title="Made with love" body="A neighbourhood kitchen cooking with care." />
          <Value icon={MapPin} title="Local and proud" body="Hot Bread Beruwala — baked here, for here." />
        </div>
      </section>

      {/* ── MENU HIGHLIGHTS ── */}
      <section className="bg-background py-16 sm:py-20">
        <div className="page-wrap">
          <SectionHeading eyebrow="Our specialties" title="Menu highlights" />
          {popular.length === 0 ? (
            <div className="mt-10">
              <EmptyState title="Menu coming soon" description="Dishes will appear here once they are published." />
            </div>
          ) : (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {popular.map((item) => (
                <HighlightCard key={item.id} item={item} settings={settings} />
              ))}
            </div>
          )}
          <div className="mt-12 text-center">
            <Link href="/menu" className="btn-order min-w-56">
              View full menu
            </Link>
          </div>
        </div>
      </section>

      {/* ── WE DELIVER bar above footer ── */}
      <section className="relative overflow-hidden bg-[#3a080c] text-white">
        <div className="relative aspect-[1772/380] w-full">
          <Image
            src={BRAND_DELIVERY_SRC}
            alt="Hot curry and paratha ready for delivery"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 flex items-center">
            <div className="page-wrap relative flex w-full items-center">
              <div className="min-w-0 max-w-[46%] pl-1 sm:max-w-[42%] sm:pl-4 lg:pl-8">
                <p className="font-script text-lg text-gold sm:text-2xl lg:text-3xl">
                  Craving something delicious?
                </p>
                <h2 className="font-heading mt-0.5 text-2xl tracking-[0.08em] uppercase sm:text-4xl lg:text-5xl">
                  We deliver!
                </h2>
                <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-white/85 sm:mt-1.5 sm:text-sm">
                  Enjoy your favorite bread &amp; snacks delivered hot to your doorstep.
                </p>
              </div>
              <Link
                href="/menu"
                className="absolute left-1/2 top-1/2 inline-flex h-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-full border-2 border-white/90 bg-black/25 px-5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase backdrop-blur-[2px] transition hover:bg-white hover:text-[#3a080c] sm:h-12 sm:px-7 sm:text-sm"
              >
                <Bike className="size-4" />
                Order now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Value({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Wheat;
  title: string;
  body: string;
}) {
  return (
    <div className="group text-center">
      <span className="mx-auto inline-flex size-16 items-center justify-center rounded-2xl border border-primary/15 bg-white text-primary shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="font-heading mt-5 text-sm tracking-[0.14em] text-primary uppercase">{title}</h3>
      <p className="text-muted-foreground mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function HighlightCard({
  item,
  settings,
}: {
  item: FoodItemWithCategory;
  settings: RestaurantSettingsRow;
}) {
  return (
    <Link href={productHref(item.slug, "/")} className="brand-card brand-card-hover group overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <FoodImage src={item.image_url} alt={item.name} className="group-hover:scale-[1.06]" />
      </div>
      <div className="p-4 text-center">
        <h3 className="font-medium text-foreground">{item.name}</h3>
        <p className="mt-1.5 text-sm font-semibold text-primary">
          <Price price={Number(item.price)} discountPrice={item.discount_price} settings={settings} />
        </p>
      </div>
    </Link>
  );
}
