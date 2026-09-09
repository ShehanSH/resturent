"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";

import { retrySmsLogAction } from "@/app/actions/sms";

export function SmsRetryButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onRetry() {
    setPending(true);
    const result = await retrySmsLogAction(id);
    setPending(false);
    if (!result.success) {
      notify.error(result.error);
      return;
    }
    notify.success("SMS sent again");
    router.refresh();
  }

  return (
    <button type="button" className="btn-admin-outline h-9 px-3 text-sm" disabled={pending} onClick={() => void onRetry()}>
      {pending ? "Sending…" : "Retry"}
    </button>
  );
}
