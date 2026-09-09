import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {cards > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: cards }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : null}
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export function AdminTableSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <div className="admin-card overflow-hidden">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-none border-b border-border/60 last:border-0" />
        ))}
      </div>
    </div>
  );
}
