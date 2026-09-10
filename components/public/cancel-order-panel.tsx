"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";

import { cancelGuestOrderAction } from "@/app/actions/checkout";
import { telHref } from "@/lib/brand";
import { notify } from "@/lib/notify";
import { guestCanCancel, guestNeedsStaffToCancel } from "@/lib/orders/transitions";
import type { OrderStatus } from "@/types/database";

export function CancelOrderPanel({
  token,
  status,
  restaurantPhone,
  cancellationReason,
}: {
  token: string;
  status: OrderStatus;
  restaurantPhone: string | null;
  cancellationReason: string | null;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (status === "CANCELLED") {
    return (
      <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-950">
        <p className="font-semibold">This order has been cancelled.</p>
        {cancellationReason ? <p className="mt-1 text-rose-900/80">{cancellationReason}</p> : null}
      </div>
    );
  }

  if (guestNeedsStaffToCancel(status)) {
    return (
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-semibold">This order is already confirmed.</p>
        <p className="mt-1 text-amber-900/80">
          The kitchen has started it, so it can no longer be cancelled here. Please call us and we
          can cancel it for you.
        </p>
        {restaurantPhone ? (
          <a href={telHref(restaurantPhone)} className="btn-order mt-4 inline-flex">
            <Phone className="size-4" aria-hidden />
            Call {restaurantPhone}
          </a>
        ) : null}
      </div>
    );
  }

  if (!guestCanCancel(status)) return null;

  async function cancel() {
    setPending(true);
    const result = await cancelGuestOrderAction({
      token,
      reason: "Cancelled by customer",
    });
    setPending(false);
    if (!result.success) {
      notify.error(result.error);
      return;
    }
    notify.success("Your order has been cancelled.");
    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white px-5 py-4">
      <p className="text-sm font-semibold">Need to cancel?</p>
      <p className="text-muted-foreground mt-1 text-sm">
        You can cancel until the kitchen confirms this order. After that, please call us.
      </p>
      {confirming ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-foreground/80">Cancel this order? This cannot be undone.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-order" disabled={pending} onClick={() => void cancel()}>
              {pending ? "Cancelling…" : "Yes, cancel order"}
            </button>
            <button
              type="button"
              className="btn-order-outline"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Keep order
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn-order-outline mt-4" onClick={() => setConfirming(true)}>
          Cancel order
        </button>
      )}
    </div>
  );
}
