import Image from "next/image";
import Link from "next/link";

import { BRAND_LOGO_SRC } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * High-quality HBB mark (red wheat, sketched bread, brush lettering on white).
 * Kept on a white circular badge so it stays readable on light and dark surfaces.
 */
export function BrandLogo({
  restaurantName,
  logoUrl: _logoUrl,
  size = "md",
  showName = true,
  surface = "light",
}: {
  restaurantName: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  surface?: "light" | "dark";
}) {
  const px = size === "sm" ? 88 : size === "lg" ? 160 : 112;
  const onDark = surface === "dark";

  return (
    <Link href="/" className="group flex min-w-0 items-center gap-3">
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-white transition-transform duration-200 group-hover:scale-105",
          size === "sm" && "size-11",
          size === "md" && "size-11 sm:size-14",
          size === "lg" && "size-16 sm:size-20",
          onDark
            ? "ring-2 ring-white/70 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.45)]"
            : "ring-1 ring-black/10 shadow-[0_6px_18px_-8px_rgba(90,18,28,0.35)]",
        )}
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt={`${restaurantName} logo`}
          width={px}
          height={px}
          sizes={`${px}px`}
          quality={80}
          className="size-full scale-[1.08] object-cover"
          priority
        />
      </span>
      {showName ? (
        <span className="min-w-0">
          <span
            className={cn(
              "font-heading block text-[0.62rem] leading-tight tracking-[0.14em] uppercase sm:text-xs sm:tracking-[0.18em]",
              onDark ? "text-cream" : "text-primary",
            )}
          >
            Hot Bread
          </span>
          <span
            className={cn(
              "font-heading mt-0.5 block text-[0.62rem] leading-tight tracking-[0.14em] uppercase sm:text-xs sm:tracking-[0.18em]",
              onDark ? "text-cream/90" : "text-primary/90",
            )}
          >
            Beruwala
          </span>
          <span className="sr-only">{restaurantName}</span>
        </span>
      ) : (
        <span className="sr-only">{restaurantName}</span>
      )}
    </Link>
  );
}
