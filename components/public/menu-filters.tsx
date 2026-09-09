"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Check, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/database";

const SORT_OPTIONS = [
  { value: "popular", label: "Featured" },
  { value: "name", label: "Name A–Z" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export function MenuBrowser({
  categories,
  resultCount,
  children,
}: {
  categories: CategoryRow[];
  resultCount: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const activeCategory = searchParams.get("category");
  const activeSort = searchParams.get("sort") ?? "popular";
  const activeQuery = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(activeQuery);

  useEffect(() => {
    setDraft(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = draft.trim();
      if (trimmed !== (searchParams.get("q") ?? "")) {
        updateParams({ q: trimmed });
      }
    }, 320);
    return () => window.clearTimeout(timer);
  }, [draft]);

  function updateParams(patch: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const href = next.toString() ? `/menu?${next.toString()}` : "/menu";
    startTransition(() => router.push(href, { scroll: false }));
  }

  const sortLabel = SORT_OPTIONS.find((option) => option.value === activeSort)?.label ?? "Featured";
  const categoryName = categories.find((category) => category.slug === activeCategory)?.name;
  const hasFilters = Boolean(activeQuery || activeCategory || activeSort !== "popular");

  return (
    <div className="mt-8">
      <div className="sticky top-14 z-20 rounded-2xl border border-black/5 bg-[color-mix(in_oklch,var(--cream),white_55%)]/90 p-3 shadow-[0_18px_40px_-28px_rgba(90,18,28,0.55)] backdrop-blur-xl sm:top-16 sm:p-4">
        <form
          className="relative"
          onSubmit={(event) => {
            event.preventDefault();
            updateParams({ q: draft.trim() });
          }}
        >
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <label className="sr-only" htmlFor="menu-search">
            Search dishes
          </label>
          <input
            id="menu-search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search dishes, snacks, drinks…"
            type="search"
            autoComplete="off"
            className="h-12 w-full rounded-full border border-black/8 bg-white pr-12 pl-11 text-sm shadow-sm outline-none transition focus-visible:border-primary/40 focus-visible:ring-3 focus-visible:ring-primary/20"
          />
          {draft ? (
            <button
              type="button"
              onClick={() => {
                setDraft("");
                updateParams({ q: "" });
              }}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-black/5"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </form>

        <div className="mt-3 flex items-center gap-2">
          <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-2 pr-1">
              <CategoryChip active={!activeCategory} onClick={() => updateParams({ category: "" })}>
                All
              </CategoryChip>
              {categories.map((category) => (
                <CategoryChip
                  key={category.id}
                  active={activeCategory === category.slug}
                  onClick={() => updateParams({ category: category.slug })}
                >
                  {category.name}
                </CategoryChip>
              ))}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-black/8 bg-white px-3.5 text-sm font-medium shadow-sm outline-none",
                "hover:border-primary/30 hover:bg-white focus-visible:ring-3 focus-visible:ring-primary/20",
              )}
              disabled={pending}
            >
              <SlidersHorizontal className="size-4 text-primary" />
              <span className="hidden sm:inline">{sortLabel}</span>
              <ArrowUpDown className="size-3.5 text-muted-foreground sm:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56 p-1.5">
              <DropdownMenuLabel>Sort dishes</DropdownMenuLabel>
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => updateParams({ sort: option.value === "popular" ? "" : option.value })}
                  className="cursor-pointer rounded-lg px-2.5 py-2"
                >
                  {option.label}
                  {activeSort === option.value ? <Check className="ml-auto size-4 text-primary" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {pending ? "Updating menu…" : `${resultCount} ${resultCount === 1 ? "dish" : "dishes"}`}
          {categoryName ? ` in ${categoryName}` : ""}
          {activeQuery ? ` for “${activeQuery}”` : ""}
        </p>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary h-8 px-2"
            onClick={() => {
              setDraft("");
              startTransition(() => router.push("/menu", { scroll: false }));
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-5 transition-opacity duration-200",
          pending && "pointer-events-none opacity-45",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-[0_8px_18px_-10px_rgba(90,18,28,0.8)]"
          : "border border-black/8 bg-white text-foreground/80 hover:-translate-y-0.5 hover:border-primary/25 hover:text-primary",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
