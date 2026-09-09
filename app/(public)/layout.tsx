import { PublicFooter } from "@/components/public/footer";
import { FloatingCartBar } from "@/components/public/floating-cart";
import { PublicHeader } from "@/components/public/header";
import { PublicMain } from "@/components/public/public-main";
import { WhatsAppFab } from "@/components/public/whatsapp-fab";
import { CartProvider } from "@/hooks/use-cart";
import { isSupabaseConfigured } from "@/lib/env";
import { getOpeningState, getRestaurantSettings } from "@/lib/services/settings.service";
import type { RestaurantSettingsRow } from "@/types/database";

const FALLBACK_SETTINGS: RestaurantSettingsRow = {
  id: "local",
  is_singleton: true,
  restaurant_name: "Hot Bread Beruwala",
  tagline: "Freshly Baked. Always Delicious.",
  description: "Made with care. Served with pride.",
  phone: null,
  email: null,
  address: "157/ EF Galle Rd, Beruwala",
  logo_url: null,
  favicon_url: null,
  hero_image_url: null,
  currency: "LKR",
  currency_symbol: "Rs.",
  locale: "en-LK",
  timezone: "Asia/Colombo",
  default_delivery_fee: 0,
  minimum_delivery_order: 0,
  order_prefix: "HBB",
  is_accepting_orders: true,
  allow_orders_when_closed: false,
  default_preparation_time: 20,
  business_hours: [],
  facebook_url: null,
  instagram_url: null,
  whatsapp_number: null,
  seo_title: null,
  seo_description: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = isSupabaseConfigured
    ? await getRestaurantSettings().catch(() => FALLBACK_SETTINGS)
    : FALLBACK_SETTINGS;
  const opening = getOpeningState(settings);

  return (
    <CartProvider>
      <div className="flex min-h-full flex-col bg-background">
        {!isSupabaseConfigured ? (
          <div className="bg-maroon relative z-50 px-4 py-2 text-center text-sm text-primary-foreground">
            Connect Supabase to load the live menu. Copy{" "}
            <code className="rounded bg-black/30 px-1">.env.example</code> to{" "}
            <code className="rounded bg-white/10 px-1">.env.local</code> and add your project keys.
          </div>
        ) : null}
        <PublicHeader restaurantName={settings.restaurant_name} logoUrl={settings.logo_url} />
        <PublicMain>{children}</PublicMain>
        <PublicFooter settings={settings} opening={opening} />
        <FloatingCartBar settings={settings} />
        <WhatsAppFab number={settings.whatsapp_number || settings.phone} />
      </div>
    </CartProvider>
  );
}
