import { CalendarDays, CircleDollarSign, ReceiptText, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExpenses } from "@/lib/kv/expenses";
import { getCategories } from "@/lib/kv/categories";
import { getMonthsWithData } from "@/lib/kv/balances";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { formatMonthLabel, resolveMonthKey } from "@/lib/month";
import { getUserById } from "@/lib/kv/users";
import type { Expense } from "@/types";

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

function calculateBalances(expenses: Expense[]) {
  const paidByUser: Record<string, number> = {};
  const owedByUser: Record<string, number> = {};

  for (const expense of expenses) {
    paidByUser[expense.pagadorId] =
      (paidByUser[expense.pagadorId] ?? 0) + expense.valor;

    for (const [userId, percent] of Object.entries(expense.split)) {
      owedByUser[userId] =
        (owedByUser[userId] ?? 0) + Math.round((expense.valor * percent) / 100);
    }
  }

  const allUsers = Array.from(
    new Set([...Object.keys(paidByUser), ...Object.keys(owedByUser)])
  );

  const netByUser = Object.fromEntries(
    allUsers.map((userId) => [
      userId,
      (paidByUser[userId] ?? 0) - (owedByUser[userId] ?? 0),
    ])
  );

  const sorted = Object.entries(netByUser).sort((a, b) => b[1] - a[1]);
  return {
    paidByUser,
    owedByUser,
    netByUser,
    sorted,
  };
}

type DashboardHomePageProps = {
  searchParams?: {
    mes?: string;
  };
};

export default async function DashboardHomePage({ searchParams }: DashboardHomePageProps) {
  const monthKey = resolveMonthKey(searchParams?.mes);
  const [expenses, categories, monthsWithData] = await Promise.all([
    getExpenses(monthKey),
    getCategories(),
    getMonthsWithData(),
  ]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.valor, 0);
  const categoryMap = new Map(categories.map((category) => [category.id, category.nome]));
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, expense) => {
    const categoryName = categoryMap.get(expense.categoriaId) ?? "Sem categoria";
    acc[categoryName] = (acc[categoryName] ?? 0) + expense.valor;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const { paidByUser, owedByUser, sorted } = calculateBalances(expenses);
  const leadingUserId = sorted[0]?.[0];
  const trailingUserId = sorted.at(-1)?.[0];

  const [leadingUser, trailingUser] = await Promise.all([
    leadingUserId ? getUserById(leadingUserId) : null,
    trailingUserId ? getUserById(trailingUserId) : null,
  ]);

  const balanceGap = sorted.length >= 2 ? sorted[0][1] : 0;
  const recentExpenses = [...expenses]
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(51,65,85,0.96))] p-6 text-white shadow-[0_40px_120px_-60px_rgba(15,23,42,0.95)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/90">
              <CalendarDays className="size-3.5" />
              {formatMonthLabel(monthKey)}
            </div>
            <h1 className="mt-4 max-w-sm text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
              Um painel que mostra quem puxou mais peso no mês.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Você já está autenticado e o núcleo da Fase 2 começou pela visão mensal, pronta para receber despesas, categorias e visitas.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <MonthSelector monthKey={monthKey} dark className="hidden md:block" />
            <div className="hidden rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-right md:block">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                meses com dados
              </div>
              <div className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
                {monthsWithData.length}
              </div>
            </div>
          </div>
        </div>

        <MonthSelector monthKey={monthKey} dark className="mt-4 md:hidden" />

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="rounded-[1.5rem] border border-white/10 bg-white/8 text-white ring-0 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <ReceiptText className="size-4 text-amber-300" />
                Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-[-0.04em]">{expenses.length}</div>
            </CardContent>
          </Card>
          <Card className="rounded-[1.5rem] border border-white/10 bg-white/8 text-white ring-0 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <CircleDollarSign className="size-4 text-amber-300" />
                Total gasto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-[-0.04em]">
                {formatCurrency(totalSpent)}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[1.5rem] border border-white/10 bg-white/8 text-white ring-0 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Scale className="size-4 text-amber-300" />
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-[-0.04em]">{categories.length}</div>
            </CardContent>
          </Card>
          <Card className="rounded-[1.5rem] border border-white/10 bg-white/8 text-white ring-0 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <CalendarDays className="size-4 text-amber-300" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-[-0.04em]">
                {Math.max(monthsWithData.length, expenses.length > 0 ? 1 : 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="text-lg tracking-[-0.03em]">Resumo do mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {expenses.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
                Ainda não há despesas em {formatMonthLabel(monthKey)}. Cadastre lançamentos na página de despesas para alimentar esta visão automaticamente.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Quem está na frente
                    </p>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
                      {leadingUser?.nome ?? "-"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pagou {formatCurrency(paidByUser[leadingUserId ?? ""] ?? 0)} e deveria arcar com {formatCurrency(owedByUser[leadingUserId ?? ""] ?? 0)}.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Diferença atual
                    </p>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
                      {formatCurrency(Math.abs(balanceGap))}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {trailingUser ? `${trailingUser.nome} está atrás na composição do mês.` : "Ainda sem contraste suficiente entre moradores."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {sorted.map(([userId, net]) => (
                    <div
                      key={userId}
                      className="rounded-[1.5rem] border border-border/60 bg-background/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {userId === leadingUserId
                              ? leadingUser?.nome
                              : userId === trailingUserId
                                ? trailingUser?.nome
                                : userId}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            saldo líquido do mês
                          </p>
                        </div>
                        <div className={net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          <span className="text-lg font-semibold tracking-[-0.03em]">
                            {net >= 0 ? "+" : "-"}
                            {formatCurrency(Math.abs(net))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
            <CardHeader>
              <CardTitle className="text-lg tracking-[-0.03em]">Categorias em destaque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCategories.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/70 px-4 py-5 text-sm text-muted-foreground">
                  As categorias já vieram do seed. Quando entrarem despesas, este bloco vai ranquear as maiores do mês.
                </div>
              ) : (
                topCategories.map(([name, total], index) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-[1.25rem] border border-border/60 bg-background/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        posição #{index + 1}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(total)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
            <CardHeader>
              <CardTitle className="text-lg tracking-[-0.03em]">Últimos lançamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentExpenses.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/70 px-4 py-5 text-sm text-muted-foreground">
                  Assim que você cadastrar a primeira despesa, ela aparece aqui com categoria, valor e pagador.
                </div>
              ) : (
                recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-[1.25rem] border border-border/60 bg-background/70 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {expense.descricao}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {categoryMap.get(expense.categoriaId) ?? "Sem categoria"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(expense.valor)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
