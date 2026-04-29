"use client";

import { useMemo, useState } from "react";
import { Download, MessageCircle, PieChart, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { buildWhatsAppExportText, buildWhatsAppUrl } from "@/lib/reports/whatsapp";
import { buildMonthlyExcelWorkbook, workbookToBase64 } from "@/lib/reports/excel";
import { computeOwedByUserForExpense, computeVisitorCostsForExpense } from "@/lib/finance/visits";
import type { Category, Expense, User, Guest } from "@/types";

interface MonthlyReportPageProps {
  monthKey: string;
  monthLabel: string;
  expenses: Expense[];
  categories: Category[];
  users: User[];
  guests: Guest[];
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function MonthlyReportPage({ monthKey, monthLabel, expenses, categories, users, guests }: MonthlyReportPageProps) {
  const [feedback, setFeedback] = useState("");

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.nome])),
    [categories]
  );

  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u.nome])),
    [users]
  );

  const totalSpent = useMemo(() => expenses.reduce((sum, expense) => sum + expense.valor, 0), [expenses]);

  const categoryTotals = useMemo(() => {
    return expenses.reduce<Record<string, number>>((acc, expense) => {
      const categoryName = categoryMap.get(expense.categoriaId) ?? "Sem categoria";
      acc[categoryName] = (acc[categoryName] ?? 0) + expense.valor;
      return acc;
    }, {});
  }, [categoryMap, expenses]);

  const topCategories = useMemo(
    () => Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 6),
    [categoryTotals]
  );

  const stepByStep = useMemo(() => {
    const paid: Record<string, number> = {};
    const baseOwed: Record<string, number> = {};
    const visitorCost: Record<string, number> = {};
    const net: Record<string, number> = {};

    for (const expense of expenses) {
      paid[expense.pagadorId] = (paid[expense.pagadorId] ?? 0) + expense.valor;

      const visitors = computeVisitorCostsForExpense(expense, monthKey, guests);
      for (const visitor of visitors) {
        visitorCost[visitor.hostId] = (visitorCost[visitor.hostId] ?? 0) + visitor.visitorCost;
      }

      const owed = computeOwedByUserForExpense(expense, monthKey, guests);
      for (const [userId, amount] of Object.entries(owed)) {
        // Strip the repasse portion from the user's base consumption display
        const extraForVisit = visitors
          .filter((v) => v.hostId === userId)
          .reduce((sum, v) => sum + v.visitorCost, 0);
        baseOwed[userId] = (baseOwed[userId] ?? 0) + (amount - extraForVisit);
      }
    }

    for (const user of users) {
      const p = paid[user.id] ?? 0;
      const b = baseOwed[user.id] ?? 0;
      const v = visitorCost[user.id] ?? 0;
      const totalOwed = b + v;
      net[user.id] = p - totalOwed;
    }

    return { paid, baseOwed, visitorCost, net };
  }, [expenses, monthKey, guests, users]);

  function handleWhatsAppExport() {
    const text = buildWhatsAppExportText({ monthKey, monthLabel, expenses, categories, users, guests });
    const url = buildWhatsAppUrl(text);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleExcelExport() {
    try {
      const wb = buildMonthlyExcelWorkbook({ monthKey, expenses, categories, users });
      const base64 = workbookToBase64(wb);
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
      link.download = `divide-ai-${monthKey}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setFeedback("Arquivo Excel gerado.");
    } catch {
      setFeedback("Não foi possível gerar o Excel. Tente novamente.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.8))] p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] dark:bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.22),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-pink-700 dark:text-pink-300">
              <PieChart className="size-3.5" />
              {monthLabel}
            </div>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">
              Relatório do mês
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Veja os totais e exporte para WhatsApp ou Excel.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <MonthSelector monthKey={monthKey} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleWhatsAppExport}>
                <MessageCircle className="mr-2 size-4" />
                Export WhatsApp
              </Button>
              <Button onClick={handleExcelExport}>
                <Download className="mr-2 size-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
            <CardHeader>
              <CardTitle className="text-lg tracking-[-0.03em]">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-3xl border border-border/60 bg-background/70 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total gasto</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  {formatCurrency(totalSpent)}
                </p>
              </div>

              {feedback ? (
                <div className="rounded-3xl border border-border/60 bg-background/70 px-4 py-4 text-sm text-foreground">
                  {feedback}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg tracking-[-0.03em]">
                <Calculator className="size-5" />
                Cálculo Passo a Passo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {users.map((user) => {
                const paid = stepByStep.paid[user.id] ?? 0;
                const baseOwed = stepByStep.baseOwed[user.id] ?? 0;
                const vCost = stepByStep.visitorCost[user.id] ?? 0;
                const net = stepByStep.net[user.id] ?? 0;
                const totalOwed = baseOwed + vCost;

                return (
                  <div key={user.id} className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <p className="font-semibold text-foreground mb-3">{user.nome}</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Pagou (desembolsou):</span>
                        <span className="font-medium text-foreground">{formatCurrency(paid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Consumo base:</span>
                        <span className="text-foreground">- {formatCurrency(baseOwed)}</span>
                      </div>
                      {vCost > 0 && (
                        <div className="flex justify-between text-sky-600 dark:text-sky-400">
                          <span>Responsabilidade por visitas:</span>
                          <span>- {formatCurrency(vCost)}</span>
                        </div>
                      )}
                      <div className="mt-2 flex justify-between border-t border-border/60 pt-2 font-medium">
                        <span>Total devido:</span>
                        <span className="text-foreground">{formatCurrency(totalOwed)}</span>
                      </div>
                      <div className="flex justify-between pt-1 font-semibold">
                        <span>Saldo final no mês:</span>
                        <span className={net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {net > 0 ? "+" : ""}{formatCurrency(net)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="text-lg tracking-[-0.03em]">Totais por categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCategories.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-background/70 px-4 py-5 text-sm leading-6 text-muted-foreground">
                Nenhuma despesa no mês.
              </div>
            ) : (
              topCategories.map(([name, total]) => (
                <div key={name} className="flex items-center justify-between rounded-3xl border border-border/60 bg-background/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">total</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
