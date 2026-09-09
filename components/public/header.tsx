"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";

import { BrandLogo } from "@/components/public/brand-logo";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About us" },
  { href: "/menu", label: "Menu" },
  { href: "/contact", label: "Contact" },
] as const;

export function PublicHeader({
  restaurantName,
  logoUrl,
}: {
  restaurantName: string;
  logoUrl: string | null;
}) {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const overlay = pathname === "/" && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        overlay
          ? "bg-transparent"
          : "glass border-b border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
      )}
    >
      <div className="page-wrap flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <BrandLogo
          restaurantName={restaurantName}
          logoUrl={logoUrl}
          size="md"
          surface={overlay ? "dark" : "light"}
        />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative rounded-lg px-4 py-2 text-[13px] font-semibold tracking-[0.12em] uppercase transition-all duration-200",
                overlay
                  ? pathname === link.href
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                  : pathname === link.href
                    ? "bg-primary/8 text-primary"
                    : "text-foreground/65 hover:bg-black/[0.03] hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className={cn(
              "relative inline-flex size-10 items-center justify-center rounded-xl transition-all duration-200",
              overlay
                ? "bg-white/12 text-white ring-1 ring-white/20 hover:bg-white/20"
                : "bg-white text-primary ring-1 ring-black/[0.06] shadow-sm hover:shadow-md hover:ring-primary/20",
            )}
            aria-label={itemCount ? `Cart, ${itemCount} items` : "Cart"}
          >
            <ShoppingBag className="size-[1.15rem]" />
            {itemCount > 0 ? (
              <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold shadow-sm">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            ) : null}
          </Link>
          <Link href="/menu" className="btn-order hidden h-10 px-5 text-xs md:inline-flex">
            Order now
          </Link>
          <button
            type="button"
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-xl lg:hidden transition-all duration-200",
              overlay
                ? "bg-white/12 text-white ring-1 ring-white/20"
                : "bg-white text-primary ring-1 ring-black/[0.06] shadow-sm",
            )}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="glass border-t border-black/[0.04] px-4 py-3 lg:hidden" aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-black/[0.03]",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/menu" className="btn-order mt-3 w-full">
            Order now
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
