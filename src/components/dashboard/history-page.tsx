"use client";

import Link from "next/link";
import { ArrowRight, CalendarRange, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User, MonthlyBalance } from "@/types";

interface MonthData {
  monthKey: string;
  label: string;
  totalSpent: number;
  expensesCount: number;
  balance: MonthlyBalance | null;
}

interface HistoryPageProps {
  data: MonthData[];
  users: User[];
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function HistoryPage({ data, users }: HistoryPageProps) {
  const userMap = new Map(users.map(u => [u.id, u.nome]));

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.15),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.8))] p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.15),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))]">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700 dark:text-indigo-300">
          <CalendarRange className="size-3.5" />
          Histórico
        </div>
        <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">
          Evolução dos gastos
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Acompanhe o fechamento de cada mês, saldos acumulados e visualize resumos passados.
        </p>
      </section>

      <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
        <CardHeader>
          <CardTitle className="text-lg tracking-[-0.03em]">Meses registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-background/70 px-4 py-8 text-center text-sm leading-6 text-muted-foreground">
                Nenhum histórico encontrado ainda.
              </div>
            ) : (
              data.map((month) => {
                // If there is a balance calculated, figure out the net results
                const balanceCalculated = !!month.balance;
                
                return (
                  <div
                    key={month.monthKey}
                    className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/70 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                        {month.label}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>{month.expensesCount} despesa(s)</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span className="font-medium text-foreground">Total: {formatCurrency(month.totalSpent)}</span>
                      </div>
                      
                      {balanceCalculated && month.balance && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
                          {Math.abs(month.balance.saldoFinal) > 0 ? (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              <AlertCircle className="size-3" />
                              Ficou pendência de {formatCurrency(Math.abs(month.balance.saldoFinal))}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="size-3" />
                              Contas zeradas
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex w-full items-center gap-2 sm:w-auto">
                      <Link 
                        href={`/?mes=${month.monthKey}`}
                        className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto rounded-full")}
                      >
                        Ver Dashboard
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
