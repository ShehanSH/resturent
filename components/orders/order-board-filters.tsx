"use client";

import { useRouter } from "next/navigation";

import { SearchField } from "@/components/admin/search-field";
import { adminOrdersHref } from "@/lib/orders/board-filters";
import { cn } from "@/lib/utils";

export function OrderBoardFilters({
  all,
  fromDate,
  toDate,
  search,
  todayDate,
  minDate,
  summary,
}: {
  all: boolean;
  fromDate: string;
  toDate: string;
  search?: string;
  todayDate: string;
  minDate: string;
  summary: string;
}) {
  const router = useRouter();

  function navigate(next: {
    all?: boolean;
    from?: string | null;
    to?: string | null;
    q?: string | null;
  }) {
    const href = adminOrdersHref({
      all: next.all ?? all,
      from: next.from !== undefined ? next.from : fromDate,
      to: next.to !== undefined ? next.to : toDate,
      q: next.q !== undefined ? next.q : search,
      today: todayDate,
    });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === href) return;
    router.push(href);
  }

  function onFromChange(value: string) {
    if (!value) return;
    const nextTo = !toDate || toDate < value ? value : toDate;
    navigate({ all: false, from: value, to: nextTo });
  }

  function onToChange(value: string) {
    if (!value) return;
    const nextFrom = !fromDate || fromDate > value ? value : fromDate;
    navigate({ all: false, from: nextFrom, to: value });
  }

  return (
    <div className="mb-5 space-y-3">
      <div className="admin-toolbar mb-0 sm:flex-wrap" role="search">
        <div className="grid gap-1">
          <span className="text-muted-foreground text-xs font-medium">Show</span>
          <button
            type="button"
            onClick={() => navigate({ all: true, from: null, to: null })}
            className={cn(
              "h-10 rounded-lg border px-3 text-sm font-medium transition",
              all
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-input bg-white text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            All orders
          </button>
        </div>
        <label className="grid min-w-[11rem] gap-1 sm:max-w-44">
          <span className="text-muted-foreground text-xs font-medium">From</span>
          <input
            type="date"
            value={fromDate}
            min={minDate}
            max={todayDate}
            onChange={(event) => onFromChange(event.target.value)}
            className="admin-input"
          />
        </label>
        <label className="grid min-w-[11rem] gap-1 sm:max-w-44">
          <span className="text-muted-foreground text-xs font-medium">To</span>
          <input
            type="date"
            value={toDate}
            min={fromDate || minDate}
            max={todayDate}
            onChange={(event) => onToChange(event.target.value)}
            className="admin-input"
          />
        </label>
        <div className="grid min-w-[16rem] flex-1 gap-1">
          <span className="text-muted-foreground text-xs font-medium">Customer</span>
          <SearchField
            name="q"
            defaultValue={search}
            placeholder="Name or phone..."
            onSearch={(q) => navigate({ q })}
          />
        </div>
      </div>
      <p className="text-muted-foreground text-sm">{summary}</p>
    </div>
  );
}
