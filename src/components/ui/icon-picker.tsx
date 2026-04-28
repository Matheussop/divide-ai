"use client";

import { useId, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LucideIconOption } from "@/lib/lucide-icons";

type IconPickerProps = {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  options: LucideIconOption[];
  disabled?: boolean;
  placeholder?: string;
};

export function IconPicker({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder = "Buscar ícone…",
}: IconPickerProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((option) => {
      const haystack = `${option.label} ${option.value}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [options, query]);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {selected ? (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <selected.icon className="size-4 text-foreground" />
            {selected.label}
          </span>
        ) : null}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={searchId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
        />
      </div>

      <div
        role="listbox"
        aria-label="Opções de ícones"
        className={cn(
          "max-h-56 overflow-auto rounded-2xl border border-border/60 bg-background/70 p-2",
          disabled && "opacity-60"
        )}
      >
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Nenhum ícone encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {filtered.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={disabled}
                  onClick={() => onChange(option.value)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left text-sm transition",
                    "hover:border-border/60 hover:bg-muted/40",
                    active && "border-emerald-500/40 bg-emerald-500/10"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <option.icon className="size-4 shrink-0 text-foreground" />
                    <span className="truncate text-foreground">{option.label}</span>
                    <span className="truncate text-xs text-muted-foreground">{option.value}</span>
                  </span>
                  {active ? (
                    <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

