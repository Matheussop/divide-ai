"use client";

import { useState } from "react";
import { Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import {
  createExpenseAction,
  deleteExpenseAction,
  updateExpenseAction,
} from "@/app/actions/expenses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { computeVisitorCostsForExpense } from "@/lib/finance/visits";
import { cn } from "@/lib/utils";
import type { Category, Expense, Guest, User } from "@/types";
import { expenseActionSchema } from "@/lib/schemas";
import { useRouter } from "next/navigation";

interface ExpensesManagerProps {
  monthKey: string;
  monthLabel: string;
  categories: Category[];
  users: User[];
  expenses: Expense[];
  guests: Guest[];
}

interface ExpenseFormState {
  amount: string;
  data: string;
  visitaPolitica: "none" | "during" | "month";
  descricao: string;
  categoriaId: string;
  pagadorId: string;
  splitMorador1: number;
  splitMorador2: number;
}

const emptyState = (categories: Category[], users: User[]): ExpenseFormState => ({
  amount: "",
  data: new Date().toISOString().slice(0, 10),
  visitaPolitica: "during",
  descricao: "",
  categoriaId: categories[0]?.id ?? "",
  pagadorId: users[0]?.id ?? "",
  splitMorador1: 50,
  splitMorador2: 50,
});

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

function formatExpenseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(year, month - 1, day));
}

export function ExpensesManager({
  monthKey,
  monthLabel,
  categories,
  users,
  expenses,
  guests,
}: ExpensesManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => emptyState(categories, users));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const categoryMap = new Map(categories.map((category) => [category.id, category.nome]));
  const userMap = new Map(users.map((user) => [user.id, user.nome]));

  const guestMap = new Map(guests.map((guest) => [guest.id, guest]));

  function resetForm() {
    setForm(emptyState(categories, users));
    setEditingId(null);
  }

  function handleSplitChange(value: number) {
    setForm((current) => ({
      ...current,
      splitMorador1: value,
      splitMorador2: 100 - value,
    }));
  }

  function handleAmountChange(value: string) {
    const onlyDigits = value.replace(/\D/g, "");
    if (!onlyDigits) {
      setForm((current) => ({ ...current, amount: "" }));
      return;
    }
    const cents = parseInt(onlyDigits, 10);
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
    
    setForm((current) => ({ ...current, amount: formatted }));
  }

  function handleCategoryOrPayerChange(newCategoryId: string, newPayerId: string) {
    const category = categories.find((c) => c.id === newCategoryId);
    const isAcerto = category?.nome.toLowerCase().includes("acerto");

    if (isAcerto) {
      // Se for acerto, o morador que pagou fica com 100% e o outro com 0%
      const pagadorIsUser1 = newPayerId === "user-1";
      setForm((current) => ({
        ...current,
        categoriaId: newCategoryId,
        pagadorId: newPayerId,
        splitMorador1: pagadorIsUser1 ? 0 : 100,
        splitMorador2: pagadorIsUser1 ? 100 : 0,
      }));
    } else {
      setForm((current) => ({
        ...current,
        categoriaId: newCategoryId,
        pagadorId: newPayerId,
      }));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const parsed = expenseActionSchema.safeParse(form);
    if (!parsed.success) {
      setFeedback(parsed.error.issues[0]?.message ?? "Verifique os campos obrigatórios.");
      return;
    }

    setSubmitting(true);
    setFeedback("");

    void (async () => {
      try {
        const result = editingId
          ? await updateExpenseAction(editingId, form, monthKey)
          : await createExpenseAction(form, monthKey);

        if (!result.success) {
          setFeedback(result.error ?? "Não foi possível salvar a despesa.");
          setSubmitting(false);
          return;
        }

        setFeedback(editingId ? "Despesa atualizada." : "Despesa criada.");
        resetForm();
        setSubmitting(false);
        router.refresh();
      } catch {
        setFeedback("Erro inesperado. Verifique sua conexão e tente novamente.");
        setSubmitting(false);
      }
    })();
  }

  function handleEdit(expense: Expense) {
    setEditingId(expense.id);
    setFeedback("");
    setForm({
      amount: new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(expense.valor / 100),
      data: expense.data ?? expense.criadoEm.slice(0, 10),
      visitaPolitica: expense.visitaPolitica ?? "during",
      descricao: expense.descricao,
      categoriaId: expense.categoriaId,
      pagadorId: expense.pagadorId,
      splitMorador1: expense.split["user-1"] ?? 50,
      splitMorador2: expense.split["user-2"] ?? 50,
    });
  }

  function handleDelete(expenseId: string) {
    const confirmed = window.confirm("Excluir esta despesa do mes selecionado?");
    if (!confirmed) return;

    setSubmitting(true);
    setFeedback("");

    void (async () => {
      try {
        const result = await deleteExpenseAction(expenseId, monthKey);
        if (!result.success) {
          setFeedback(result.error ?? "Não foi possível excluir a despesa.");
          setSubmitting(false);
          return;
        }

        if (editingId === expenseId) {
          resetForm();
        }

        setFeedback("Despesa excluída.");
        setSubmitting(false);
        router.refresh();
      } catch {
        setFeedback("Erro inesperado ao excluir. Tente novamente.");
        setSubmitting(false);
      }
    })();
  }

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.valor, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.8))] p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              <ReceiptText className="size-3.5" />
              {monthLabel}
            </div>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">
              Cadastro rápido para não deixar a conta escapar.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Esta tela grava no Redis do mes selecionado, calcula o split entre moradores e alimenta o dashboard automaticamente.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <MonthSelector monthKey={monthKey} />
            <div className="rounded-3xl border border-border/60 bg-background/75 px-4 py-3 text-right backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                total do mes
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {formatCurrency(totalSpent)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg tracking-[-0.03em]">
              <Plus className="size-4 text-amber-600 dark:text-amber-400" />
              {editingId ? "Editar despesa" : "Nova despesa"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* <div className="mb-5 rounded-3xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm font-semibold tracking-[-0.02em] text-foreground">
                Como preencher
              </p>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Valor</span>: o total pago nesta compra/conta.
                </p>
                <p>
                  <span className="font-semibold text-foreground">Data da despesa</span>: quando a despesa vale (use a data real do gasto/conta — isso afeta visita).
                </p>
                <p>
                  <span className="font-semibold text-foreground">Descrição</span>: um resumo pra facilitar achar depois (ex.: “aluguel”, “mercado”, “internet”).
                </p>
                <p>
                  <span className="font-semibold text-foreground">Como a visita entra</span>:
                  <span className="ml-1 inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground">
                      Ignorar
                    </span>
                    <span className="text-xs">→ pontual (ex.: mercado).</span>
                    <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground">
                      Durante a visita
                    </span>
                    <span className="text-xs">→ só se a data cair no período.</span>
                    <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground">
                      Mês inteiro
                    </span>
                    <span className="text-xs">→ mensal (ex.: aluguel).</span>
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Categoria</span>: agrupa no dashboard/relatórios.
                </p>
                <p>
                  <span className="font-semibold text-foreground">Quem pagou</span>: quem desembolsou no momento.
                </p>
                <p>
                  <span className="font-semibold text-foreground">Split</span>: divisão base entre moradores (a visita ajusta por cima conforme a opção escolhida).
                </p>
              </div>
            </div> */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-semibold text-foreground">Valor</Label>
                  <Input
                    id="amount"
                    inputMode="numeric"
                    placeholder="Ex.: 0,00"
                    value={form.amount}
                    onChange={(event) => handleAmountChange(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data" className="text-sm font-semibold text-foreground">Data da despesa</Label>
                  <Input
                    id="data"
                    type="date"
                    value={form.data}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, data: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="descricao" className="text-sm font-semibold text-foreground">Descrição</Label>
                  <Input
                    id="descricao"
                    placeholder="Ex.: mercado da semana"
                    value={form.descricao}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, descricao: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="visitaPolitica" className="text-sm font-semibold text-foreground">
                    Como a visita entra nessa despesa
                  </Label>
                  <select
                    id="visitaPolitica"
                    value={form.visitaPolitica}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        visitaPolitica: event.target.value as ExpenseFormState["visitaPolitica"],
                      }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="none">Ignorar visita (pontual, ex.: mercado)</option>
                    <option value="during">Só durante o período da visita (pontual)</option>
                    <option value="month">Ratear no mês inteiro (ex.: aluguel)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="categoriaId" className="text-sm font-semibold text-foreground">Categoria</Label>
                  <select
                    id="categoriaId"
                    value={form.categoriaId}
                    onChange={(event) =>
                      handleCategoryOrPayerChange(event.target.value, form.pagadorId)
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pagadorId" className="text-sm font-semibold text-foreground">Quem pagou</Label>
                  <select
                    id="pagadorId"
                    value={form.pagadorId}
                    onChange={(event) =>
                      handleCategoryOrPayerChange(form.categoriaId, event.target.value)
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3 rounded-3xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="splitMorador1" className="text-sm font-semibold text-foreground">Split entre moradores</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ajuste quanto do valor fica com o {userMap.get(form.pagadorId)} e o restante fecha automaticamente no {userMap.get(form.pagadorId === "user-1" ? "user-2" : "user-1")}.
                    </p>
                  </div>
                  <div className="text-right text-sm font-semibold text-foreground">
                    <div>{form.splitMorador1}% / {form.splitMorador2}%</div>
                  </div>
                </div>

                <input
                  id="splitMorador1"
                  type="range"
                  min={0}
                  max={100}
                  value={form.splitMorador1}
                  onChange={(event) => handleSplitChange(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-amber-500"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm font-medium text-foreground">
                    {userMap.get(form.pagadorId)}: <span className="font-semibold">{form.splitMorador1}%</span>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-right text-sm font-medium text-foreground">
                    {userMap.get(form.pagadorId === "user-1" ? "user-2" : "user-1")}: <span className="font-semibold">{form.splitMorador2}%</span>
                  </div>
                </div>
              </div>

              {feedback ? (
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm font-medium text-foreground">
                  {feedback}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={submitting}>
                  {editingId ? "Salvar alterações" : "Criar despesa"}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Cancelar edição
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="text-lg tracking-[-0.03em]">
              Lançamentos do mês atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-background/70 px-4 py-5 text-sm leading-6 text-muted-foreground">
                Nenhuma despesa cadastrada para este mes. Use o formulario ao lado para alimentar o dashboard.
              </div>
            ) : (
              expenses
                .slice()
                .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
                .map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-3xl border border-border/60 bg-background/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {(() => {
                          const visitors = computeVisitorCostsForExpense(expense, monthKey, guests);
                          if (visitors.length === 0) return null;

                          const policy = expense.visitaPolitica ?? "during";

                          return (
                            <div className="mb-2 space-y-0.5">
                              {visitors.map((visitor) => {
                                const guest = guestMap.get(visitor.guestId);
                                const guestName = guest?.nome ?? "Visita";
                                const hostName = userMap.get(visitor.hostId) ?? visitor.hostId;
                                return (
                                  <p key={visitor.guestId} className="text-xs font-medium text-sky-700 dark:text-sky-200">
                                    Visita ({guestName}) repassou {formatCurrency(visitor.visitorCost)} para {hostName}
                                    {policy === "month" ? " (mês inteiro)" : " (durante a visita)"}
                                  </p>
                                );
                              })}
                            </div>
                          );
                        })()}
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {expense.descricao}
                          </p>
                          {expense.visitaId ? (
                            <Badge
                              variant="secondary"
                              className="border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
                            >
                              Com visita
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {categoryMap.get(expense.categoriaId) ?? "Sem categoria"} · pago por {userMap.get(expense.pagadorId) ?? expense.pagadorId}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          split {expense.split["user-1"] ?? 0}% / {expense.split["user-2"] ?? 0}% · {formatExpenseDate(expense.data ?? expense.criadoEm.slice(0, 10))}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(expense.valor)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={() => handleEdit(expense)}
                            disabled={submitting}
                            className={cn(editingId === expense.id && "border-amber-500/60 text-amber-700 dark:text-amber-300")}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={() => handleDelete(expense.id)}
                            disabled={submitting}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
