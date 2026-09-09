import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="page-wrap space-y-6 py-10">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-80 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
