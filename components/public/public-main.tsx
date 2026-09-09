"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function PublicMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return (
    <main
      className={cn(
        "flex-1",
        !isHome && "pt-14 sm:pt-16",
        !isHome && "pb-28 md:pb-0",
      )}
    >
      {children}
    </main>
  );
}
