import type { Metadata, Viewport } from "next";
import { Geist_Mono, Great_Vibes, Oswald, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isSupabaseConfigured } from "@/lib/env";
import { getRestaurantSettings } from "@/lib/services/settings.service";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  if (!isSupabaseConfigured) {
    return {
      title: { default: "Hot Bread Beruwala", template: "%s" },
      description: "Hot Bread Beruwala — freshly prepared food for pickup and delivery.",
      icons: [{ url: "/brand/hbb-logo-hq.png" }],
    };
  }

  const settings = await getRestaurantSettings().catch(() => null);
  const name = settings?.restaurant_name ?? "Hot Bread Beruwala";
  return {
    title: {
      default: settings?.seo_title || name,
      template: `%s | ${name}`,
    },
    description:
      settings?.seo_description || settings?.description || `Order from ${name}.`,
    icons: settings?.favicon_url
      ? [{ url: settings.favicon_url }, { url: "/brand/hbb-logo-hq.png" }]
      : [{ url: "/brand/hbb-logo-hq.png" }],
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#7a1520",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${oswald.variable} ${greatVibes.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TooltipProvider>
            {children}
            <Toaster position="top-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
