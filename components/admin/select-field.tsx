"use client";

import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function AdminSelect({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  options,
  className,
  icon,
  "aria-label": ariaLabel,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  className?: string;
  icon?: React.ReactNode;
  "aria-label"?: string;
}) {
  const controlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const current = controlled ? value : uncontrolled;
  const labels = Object.fromEntries(options.map((option) => [option.value, option.label]));

  useEffect(() => {
    if (!controlled && defaultValue !== undefined) setUncontrolled(defaultValue);
  }, [controlled, defaultValue]);

  return (
    <>
      {name ? <input type="hidden" name={name} value={current ?? ""} /> : null}
      <Select
        items={labels}
        value={current || null}
        onValueChange={(next) => {
          if (next == null) return;
          const resolved = String(next);
          if (!controlled) setUncontrolled(resolved);
          onValueChange?.(resolved);
        }}
      >
        <SelectTrigger
          id={id}
          icon={icon}
          aria-label={ariaLabel}
          className={cn("admin-select-trigger", className)}
        >
          <SelectValue placeholder={placeholder}>
            {(selected: string | null) => (selected ? (labels[selected] ?? selected) : (placeholder ?? ""))}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} className="admin-select-content">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="admin-select-item">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
