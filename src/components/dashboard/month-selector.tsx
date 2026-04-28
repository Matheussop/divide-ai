"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
  monthKey: string;
  dark?: boolean;
  className?: string;
}

export function MonthSelector({ monthKey, dark = false, className }: MonthSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", nextMonth);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor="month-selector"
        className={cn(
          "block text-[11px] font-semibold uppercase tracking-[0.16em]",
          dark ? "text-slate-400" : "text-muted-foreground"
        )}
      >
        Mes de referencia
      </label>
      <input
        id="month-selector"
        type="month"
        value={monthKey}
        onChange={(event) => handleChange(event.target.value)}
        className={cn(
          "h-10 rounded-xl border px-3 text-sm outline-none transition-colors",
          dark
            ? "border-white/15 bg-white/10 text-white focus-visible:border-white/35"
            : "border-input bg-transparent text-foreground focus-visible:border-ring"
        )}
      />
    </div>
  );
}
