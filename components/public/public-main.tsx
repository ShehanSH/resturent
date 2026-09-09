"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function PublicMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main className={cn("flex-1 pb-24 md:pb-0", pathname !== "/" && "pt-[4.5rem]")}>{children}</main>
  );
}
