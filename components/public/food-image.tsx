import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

export function FoodImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 400px",
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[color-mix(in_oklch,var(--cream),var(--primary)_10%)] text-primary",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/70 shadow-sm">
          <UtensilsCrossed className="size-5 opacity-70" aria-hidden />
        </span>
        <span className="px-3 text-center text-[11px] font-medium tracking-wide opacity-60">Photo coming soon</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover transition duration-300", className)}
    />
  );
}
