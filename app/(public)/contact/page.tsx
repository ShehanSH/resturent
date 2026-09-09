import type { Metadata } from "next";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";

import { SectionHeading } from "@/components/public/section-heading";
import { restaurantAddress, restaurantMapsUrl, telHref } from "@/lib/brand";
import { isSupabaseConfigured } from "@/lib/env";
import { formatClock } from "@/lib/format";
import { dayName, getOpeningState, getRestaurantSettings } from "@/lib/services/settings.service";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  if (!isSupabaseConfigured) return { title: "Contact" };
  const settings = await getRestaurantSettings();
  return buildMetadata({
    title: `Contact | ${settings.restaurant_name}`,
    description: `Find ${settings.restaurant_name} — address, phone and opening hours.`,
    path: "/contact",
    settings,
  });
}

export default async function ContactPage() {
  const settings = isSupabaseConfigured ? await getRestaurantSettings() : null;
  const opening = settings ? getOpeningState(settings) : null;

  return (
    <div className="page-wrap py-16">
      <SectionHeading eyebrow="Get in touch" title="Contact" />
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-2">
        <div className="brand-card space-y-5 p-8">
          <Info
            icon={MapPin}
            label="Address"
            value={restaurantAddress(settings?.address)}
            href={restaurantMapsUrl(settings?.address)}
          />
          <Info
            icon={Phone}
            label="Phone"
            value={settings?.phone || "Add a phone number in settings."}
            href={settings?.phone ? telHref(settings.phone) : undefined}
          />
          <Info
            icon={Mail}
            label="Email"
            value={settings?.email || "Add an email in settings."}
            href={settings?.email ? `mailto:${settings.email}` : undefined}
          />
          {opening ? (
            <p className="flex items-center gap-3 text-sm">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/8">
                <Clock3 className="size-3.5 text-primary" />
              </span>
              {opening.label}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            {settings?.phone ? (
              <a href={telHref(settings.phone)} className="btn-order">
                Call now
              </a>
            ) : null}
            <a
              href={restaurantMapsUrl(settings?.address)}
              className="btn-order-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions
            </a>
          </div>
        </div>
        <div className="brand-card p-8">
          <h2 className="font-heading text-xl tracking-wide text-primary uppercase">Opening hours</h2>
          <ul className="mt-5 space-y-1">
            {(settings?.business_hours ?? []).map((entry) => (
              <li key={entry.day} className="flex justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors odd:bg-black/[0.02]">
                <span className="font-medium">{dayName(entry.day)}</span>
                <span className="text-muted-foreground">
                  {entry.is_open
                    ? `${formatClock(entry.opens_at)} – ${formatClock(entry.closes_at)}`
                    : "Closed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <a
      href={href}
      className="transition-colors hover:text-primary"
      {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {value}
    </a>
  ) : (
    value
  );
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8">
        <Icon className="size-3.5 text-primary" />
      </span>
      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</p>
        <p className="mt-1 text-sm">{content}</p>
      </div>
    </div>
  );
}
