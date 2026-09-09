"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { BrandLogo } from "@/components/public/brand-logo";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

const NAV: Record<UserRole, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/sms", label: "SMS log", icon: MessageSquare },
    { href: "/admin/categories", label: "Categories", icon: Tag },
    { href: "/admin/products", label: "Food items", icon: UtensilsCrossed },
    { href: "/admin/options", label: "Item options", icon: SlidersHorizontal },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    { href: "/admin/staff", label: "Staff", icon: Users },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
  CASHIER: [{ href: "/cashier/orders", label: "Orders", icon: ShoppingBag }],
  DELIVERY: [{ href: "/delivery/orders", label: "My deliveries", icon: ShoppingBag }],
};

export function StaffShell({
  role,
  name,
  children,
}: {
  role: UserRole;
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const links = NAV[role];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="admin-app flex h-svh overflow-hidden bg-[#f6f4f1]">
      <aside className="hidden h-svh w-60 shrink-0 flex-col bg-[#1a0b0d] text-white md:flex">
        <div className="border-b border-white/10 px-4 py-4">
          <BrandLogo restaurantName="Hot Bread Beruwala" size="sm" surface="dark" />
          <p className="mt-2 text-xs text-white/50">Staff console</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3" aria-label="Staff">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                  active
                    ? "bg-white/12 text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white",
                )}
              >
                <link.icon className={cn("size-4", active ? "text-white" : "text-white/50")} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction} className="border-t border-white/10 p-2.5">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-start gap-2 rounded-lg px-2.5 text-sm text-white/65 transition hover:bg-white/8 hover:text-white"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-border/80 bg-white px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-primary/10 text-primary hidden size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:inline-flex">
              {initials || "HB"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              <p className="text-muted-foreground truncate text-xs">Hot Bread Beruwala</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <nav className="flex max-w-[70vw] gap-1 overflow-x-auto" aria-label="Staff mobile">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <link.icon className="size-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center rounded-lg"
                aria-label="Log out"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] p-4 md:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
