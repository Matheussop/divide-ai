"use client";

import { useState } from "react";
import { Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import {
  createExpenseAction,
  deleteExpenseAction,
  updateExpenseAction,
} from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { cn } from "@/lib/utils";
import type { Category, Expense, User } from "@/types";
import { useRouter } from "next/navigation";

interface ExpensesManagerProps {
  monthKey: string;
  monthLabel: string;
  categories: Category[];
  users: User[];
  expenses: Expense[];
}

interface ExpenseFormState {
  amount: string;
  descricao: string;
  categoriaId: string;
  pagadorId: string;
  splitMorador1: number;
  splitMorador2: number;
}

const emptyState = (categories: Category[], users: User[]): ExpenseFormState => ({
  amount: "",
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

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ExpensesManager({
  monthKey,
  monthLabel,
  categories,
  users,
  expenses,
}: ExpensesManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => emptyState(categories, users));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const categoryMap = new Map(categories.map((category) => [category.id, category.nome]));
  const userMap = new Map(users.map((user) => [user.id, user.nome]));

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
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
      amount: (expense.valor / 100).toFixed(2).replace(".", ","),
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-semibold text-foreground">Valor</Label>
                  <Input
                    id="amount"
                    placeholder="Ex.: 249,90"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, amount: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="categoriaId" className="text-sm font-semibold text-foreground">Categoria</Label>
                  <select
                    id="categoriaId"
                    value={form.categoriaId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, categoriaId: event.target.value }))
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
                      setForm((current) => ({ ...current, pagadorId: event.target.value }))
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
                      Ajuste quanto do valor fica com o Morador 1 e o restante fecha automaticamente no Morador 2.
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
                    Morador 1: <span className="font-semibold">{form.splitMorador1}%</span>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-right text-sm font-medium text-foreground">
                    Morador 2: <span className="font-semibold">{form.splitMorador2}%</span>
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
                        <p className="text-sm font-medium text-foreground">
                          {expense.descricao}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {categoryMap.get(expense.categoriaId) ?? "Sem categoria"} · pago por {userMap.get(expense.pagadorId) ?? expense.pagadorId}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          split {expense.split["user-1"] ?? 0}% / {expense.split["user-2"] ?? 0}% · {formatTimestamp(expense.criadoEm)}
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
