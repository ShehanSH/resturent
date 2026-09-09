import { PackageOpen } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-card flex flex-col items-center px-6 py-16 text-center">
      <span className="bg-muted text-muted-foreground inline-flex size-12 items-center justify-center rounded-xl">
        <PackageOpen className="size-5" aria-hidden />
      </span>
      <p className="mt-4 text-base font-semibold tracking-tight">{title}</p>
      <p className="text-muted-foreground mx-auto mt-1.5 max-w-md text-sm">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
