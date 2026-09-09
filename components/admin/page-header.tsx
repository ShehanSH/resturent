import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
  backHref,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="text-muted-foreground mb-3 inline-flex items-center gap-1.5 text-sm transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        ) : null}
        {eyebrow ? <p className="text-muted-foreground text-xs font-medium">{eyebrow}</p> : null}
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="text-muted-foreground mt-1.5 max-w-xl text-sm">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AdminPrimaryLink({
  href,
  children,
  className,
  icon = true,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
}) {
  return (
    <Link href={href} className={cn("btn-admin", className)}>
      {icon ? <Plus className="size-4" /> : null}
      {children}
    </Link>
  );
}
