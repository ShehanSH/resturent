"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function SearchField({
  name,
  defaultValue,
  placeholder,
  className,
  onSearch,
}: {
  name: string;
  defaultValue?: string;
  placeholder: string;
  className?: string;
  onSearch?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(defaultValue ?? "");
  }, [defaultValue]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function emit(next: string, immediate = false) {
    if (!onSearch) return;
    if (timer.current) clearTimeout(timer.current);
    if (immediate) {
      onSearch(next);
      return;
    }
    timer.current = setTimeout(() => onSearch(next), 350);
  }

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <input
        name={name}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          emit(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            emit(value, true);
          }
        }}
        placeholder={placeholder}
        className="admin-search-input"
        type="search"
        aria-label={placeholder}
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md"
          onClick={() => {
            setValue("");
            emit("", true);
          }}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
