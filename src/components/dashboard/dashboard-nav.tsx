"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarRange,
  CircleDollarSign,
  House,
  Tags,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Resumo", icon: House },
  { href: "/despesas", label: "Despesas", icon: CircleDollarSign },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/visitas", label: "Visitas", icon: UsersRound },
  { href: "/historico", label: "Histórico", icon: CalendarRange },
];

export function DashboardNav({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedMonth = searchParams.get("mes");

  return (
    <nav className={className}>
      <div
        className={cn(
          "border border-border/60 bg-card/85 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)]",
          compact
            ? "grid grid-cols-5 gap-2 rounded-[1.75rem] p-2"
            : "flex flex-wrap gap-2 rounded-3xl p-2"
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const href = selectedMonth
            ? `${item.href}?mes=${encodeURIComponent(selectedMonth)}`
            : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium tracking-[0.02em] transition-all",
                compact && "min-h-14 flex-col gap-1 px-1 text-[11px]",
                !compact && "min-w-34",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
