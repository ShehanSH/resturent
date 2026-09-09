import { ORDER_STATUS_LABELS, ORDER_TIMELINE } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus, OrderType } from "@/types/database";

export function OrderTimeline({
  orderType,
  status,
  history,
  timezone,
}: {
  orderType: OrderType;
  status: OrderStatus;
  history: { status: OrderStatus; changed_at: string }[];
  timezone: string;
}) {
  const steps = status === "CANCELLED" ? [...ORDER_TIMELINE[orderType], "CANCELLED" as const] : ORDER_TIMELINE[orderType];
  const currentIndex = steps.indexOf(status as (typeof steps)[number]);

  return (
    <ol className="space-y-4">
      {steps.map((step, index) => {
        const reached = status === "CANCELLED" ? step === "CANCELLED" || index <= currentIndex : index <= currentIndex;
        const stamp = history.find((entry) => entry.status === step)?.changed_at;
        return (
          <li key={step} className="flex gap-3">
            <span
              className={cn(
                "mt-1 size-3 shrink-0 rounded-full",
                reached ? "bg-primary" : "bg-muted",
              )}
              aria-hidden
            />
            <div>
              <p className={cn("font-medium", reached ? "" : "text-muted-foreground")}>
                {ORDER_STATUS_LABELS[step]}
              </p>
              {stamp ? (
                <p className="text-muted-foreground text-xs">{formatDateTime(stamp, timezone)}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
