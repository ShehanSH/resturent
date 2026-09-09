import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { BrandLogo } from "@/components/public/brand-logo";
import { formatClock } from "@/lib/format";
import { restaurantAddress, restaurantMapsUrl, telHref, whatsappHref } from "@/lib/brand";
import { dayName, type OpeningState } from "@/lib/opening";
import type { RestaurantSettingsRow } from "@/types/database";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/menu", label: "Menu" },
  { href: "/contact", label: "Contact Us" },
] as const;

export function PublicFooter({
  settings,
  opening,
}: {
  settings: RestaurantSettingsRow;
  opening: OpeningState;
}) {
  const hours = settings.business_hours ?? [];
  const address = restaurantAddress(settings.address);
  const phone = settings.phone || "+94 77 123 4567";
  const email = settings.email || "hotbreadberuwala@gmail.com";
  const facebook = settings.facebook_url || "https://www.facebook.com/hotbreadberuwala";
  const instagram = settings.instagram_url || "https://www.instagram.com/hotbreadberuwala";
  const whatsapp = whatsappHref(settings.whatsapp_number || settings.phone || "94771234567");

  return (
    <footer className="relative overflow-hidden bg-[#1a080a] text-white">
      <WheatDecoration />

      <div className="page-wrap relative grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        <div className="lg:pr-8">
          <BrandLogo
            restaurantName={settings.restaurant_name}
            logoUrl={settings.logo_url}
            size="lg"
            surface="dark"
            showName={false}
          />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/80">
            {settings.restaurant_name} – Your neighborhood bakery, serving freshness &amp; happiness daily.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <SocialLink href={facebook} label="Facebook">
              <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v9h4v-9h3.2L17 11h-4V9c0-.6.4-1 1-1Z" />
            </SocialLink>
            <SocialLink href={instagram} label="Instagram">
              <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2ZM17.2 6.4a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9Z" />
            </SocialLink>
            {whatsapp ? (
              <SocialLink href={whatsapp} label="WhatsApp">
                <path d="M20.5 3.5A11 11 0 0 0 2.1 17.1L1 23l6.1-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5ZM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.6.7.7-3.5-.2-.3A9 9 0 1 1 12 21Zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.1-.2a.5.5 0 0 0 0-.5c0-.1-.6-1.5-.8-2s-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.5 11.5 0 0 0 4.4 3.9 15 15 0 0 0 1.5.5 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z" />
              </SocialLink>
            ) : null}
          </div>
        </div>

        <div className="lg:border-l lg:border-white/15 lg:px-8">
          <FooterHeading>Quick Links</FooterHeading>
          <ul className="mt-5 space-y-3 text-sm text-white/85">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:border-l lg:border-white/15 lg:px-8">
          <FooterHeading>Contact Us</FooterHeading>
          <ul className="mt-5 space-y-4 text-sm text-white/85">
            <ContactRow href={restaurantMapsUrl(settings.address)} icon={MapPin} label="Address">
              {address}
            </ContactRow>
            <ContactRow href={telHref(phone)} icon={Phone} label="Phone">
              {phone}
            </ContactRow>
            <ContactRow href={`mailto:${email}`} icon={Mail} label="Email">
              {email}
            </ContactRow>
          </ul>
        </div>

        <div className="relative lg:border-l lg:border-white/15 lg:pl-8">
          <FooterHeading>Opening Hours</FooterHeading>
          <p className="mt-5 text-sm font-medium text-white">{opening.label}</p>
          {hours.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {hours.slice(0, 7).map((entry) => (
                <li key={entry.day} className="flex justify-between gap-4">
                  <span>{dayName(entry.day)}</span>
                  <span className="text-white/70">
                    {entry.is_open
                      ? `${formatClock(entry.opens_at)} – ${formatClock(entry.closes_at)}`
                      : "Closed"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 text-sm text-white/80">
              <p>Everyday</p>
              <p className="mt-1">6.00 AM – 8.00 PM</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative border-t border-white/15">
        <p className="page-wrap py-5 text-center text-xs tracking-wide text-white/70">
          © {new Date().getFullYear()} {settings.restaurant_name}. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold tracking-[0.18em] text-white uppercase">{children}</p>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex size-9 items-center justify-center rounded-full bg-[#7a1520] text-white transition hover:bg-[#9a1c2a]"
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
        {children}
      </svg>
    </a>
  );
}

function ContactRow({
  href,
  icon: Icon,
  label,
  children,
}: {
  href: string;
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        className="flex items-start gap-3 transition-colors hover:text-white"
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#7a1520]">
          <Icon className="size-3.5 text-white" aria-hidden />
        </span>
        <span>
          <span className="sr-only">{label}: </span>
          {children}
        </span>
      </a>
    </li>
  );
}

function WheatDecoration() {
  return (
    <svg
      viewBox="0 0 120 160"
      className="pointer-events-none absolute right-2 bottom-16 hidden h-40 w-28 text-[#c4a35a]/35 lg:block"
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
        <path d="M60 150V18" />
        <path d="M60 36c-10-6-18-4-26 2 8 2 18 8 26 14" />
        <path d="M60 36c10-6 18-4 26 2-8 2-18 8-26 14" />
        <path d="M60 58c-12-6-20-4-28 4 10 2 20 8 28 14" />
        <path d="M60 58c12-6 20-4 28 4-10 2-20 8-28 14" />
        <path d="M60 82c-12-6-22-4-30 4 10 2 22 10 30 16" />
        <path d="M60 82c12-6 22-4 30 4-10 2-22 10-30 16" />
        <path d="M60 108c-10-4-20-2-26 6 8 2 18 8 26 12" />
        <path d="M60 108c10-4 20-2 26 6-8 2-18 8-26 12" />
      </g>
    </svg>
  );
}
