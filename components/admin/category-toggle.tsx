"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";

import { setCategoryActiveAction } from "@/app/actions/catalog";

export function CategoryToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const result = await setCategoryActiveAction(id, !active);
    setPending(false);
    if (!result.success) notify.error(result.error);
  }

  return (
    <button
      type="button"
      className={
        active
          ? "inline-flex h-9 items-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
          : "inline-flex h-9 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
      }
      disabled={pending}
      onClick={() => void onClick()}
    >
      {pending ? "…" : active ? "Hide" : "Show"}
    </button>
  );
}
