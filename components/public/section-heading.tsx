import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className={cn("font-script text-3xl", light ? "text-gold" : "text-gold")}>{eyebrow}</p>
      <h2
        className={cn(
          "font-heading mt-1 text-3xl tracking-[0.1em] uppercase sm:text-4xl",
          light ? "text-primary-foreground" : "text-primary",
        )}
      >
        {title}
      </h2>
      <span className="mt-4 inline-flex items-center justify-center gap-3" aria-hidden>
        <span className={cn("h-px w-10 rounded-full", light ? "bg-gold/50" : "bg-primary/20")} />
        <span className={cn("size-1.5 rounded-full", light ? "bg-gold" : "bg-primary")} />
        <span className={cn("h-px w-10 rounded-full", light ? "bg-gold/50" : "bg-primary/20")} />
      </span>
      {description ? (
        <p className={cn("mt-4 text-sm leading-relaxed sm:text-base", light ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
