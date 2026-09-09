import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const VARIANTS = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/15",
  danger: "bg-rose-50 text-rose-800 ring-rose-600/15",
  info: "bg-sky-50 text-sky-800 ring-sky-600/15",
  brand: "bg-primary/8 text-primary ring-primary/15",
  neutral: "bg-neutral-100 text-neutral-600 ring-neutral-500/10",
} as const;

const DOT = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  brand: "bg-primary",
  neutral: "bg-neutral-400",
} as const;

export function StatusBadge({
  variant,
  children,
  dot = true,
}: {
  variant: keyof typeof VARIANTS;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        VARIANTS[variant],
      )}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", DOT[variant])} aria-hidden /> : null}
      {children}
    </span>
  );
}

export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-card overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("admin-card", className)}>{children}</div>;
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-card space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="admin-card p-4 sm:p-5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

export function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border-2 px-4 py-4 text-left transition",
        checked ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-black/[0.02] hover:border-primary/15",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg",
          checked ? "bg-primary text-primary-foreground" : "bg-black/[0.06]",
        )}
      >
        {checked ? <Check className="size-3.5" /> : null}
      </span>
      <span>
        <span className="block font-medium">{label}</span>
        <span className="text-muted-foreground mt-0.5 block text-xs">{description}</span>
      </span>
    </button>
  );
}

export function RangeTabs({
  basePath,
  value,
  options,
}: {
  basePath: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-border/80 bg-white p-1">
      {options.map((item) => (
        <a
          key={item.value}
          href={`${basePath}?range=${item.value}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            value === item.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
