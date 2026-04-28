"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import {
  applyRecurringToMonthAction,
  createRecurringAction,
  deleteRecurringAction,
  updateRecurringAction,
} from "@/app/actions/recurring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { cn } from "@/lib/utils";
import type { Category, RecurringTemplate, User } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMonthLabel, resolveMonthKey } from "@/lib/month";

interface RecurringManagerProps {
  templates: RecurringTemplate[];
  categories: Category[];
  users: User[];
}

interface RecurringFormState {
  amount: string;
  descricao: string;
  categoriaId: string;
  splitMorador1: number;
  splitMorador2: number;
  ativo: boolean;
  visitaPolitica: "none" | "during" | "month";
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

const emptyState = (categories: Category[]): RecurringFormState => ({
  amount: "",
  descricao: "",
  categoriaId: categories[0]?.id ?? "",
  splitMorador1: 50,
  splitMorador2: 50,
  ativo: true,
  visitaPolitica: "month",
});

export function RecurringManager({ templates, categories, users }: RecurringManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthKey = resolveMonthKey(searchParams.get("mes"));

  const [form, setForm] = useState(() => emptyState(categories));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR")),
    [templates]
  );

  const categoryMap = new Map(categories.map((category) => [category.id, category.nome]));

  function resetForm() {
    setForm(emptyState(categories));
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
          ? await updateRecurringAction(editingId, form)
          : await createRecurringAction(form);

        if (!result.success) {
          setFeedback(result.error ?? "Não foi possível salvar o template.");
          setSubmitting(false);
          return;
        }

        setFeedback(editingId ? "Template atualizado." : "Template criado.");
        resetForm();
        setSubmitting(false);
        router.refresh();
      } catch {
        setFeedback("Erro inesperado. Tente novamente.");
        setSubmitting(false);
      }
    })();
  }

  function handleEdit(template: RecurringTemplate) {
    setEditingId(template.id);
    setFeedback("");
    setForm({
      amount: (template.valor / 100).toFixed(2).replace(".", ","),
      descricao: template.descricao,
      categoriaId: template.categoriaId,
      splitMorador1: template.split["user-1"] ?? 50,
      splitMorador2: template.split["user-2"] ?? 50,
      ativo: template.ativo,
      visitaPolitica: template.visitaPolitica ?? "month",
    });
  }

  function handleDelete(templateId: string, templateName: string) {
    const confirmed = window.confirm(`Excluir o template "${templateName}"?`);
    if (!confirmed) return;

    setSubmitting(true);
    setFeedback("");

    void (async () => {
      try {
        const result = await deleteRecurringAction(templateId);
        if (!result.success) {
          setFeedback(result.error ?? "Não foi possível excluir o template.");
          setSubmitting(false);
          return;
        }

        if (editingId === templateId) {
          resetForm();
        }

        setFeedback("Template excluído.");
        setSubmitting(false);
        router.refresh();
      } catch {
        setFeedback("Erro inesperado ao excluir. Tente novamente.");
        setSubmitting(false);
      }
    })();
  }

  function handleApplyToMonth() {
    if (submitting) return;
    setSubmitting(true);
    setFeedback("");

    void (async () => {
      try {
        const result = await applyRecurringToMonthAction(monthKey);
        if (!result.success) {
          setFeedback(result.error ?? "Não foi possível aplicar recorrências.");
          setSubmitting(false);
          return;
        }

        const createdCount = result.data?.created.length ?? 0;
        const skippedCount = result.data?.skipped ?? 0;
        setFeedback(
          `Recorrências aplicadas: ${createdCount} criada(s), ${skippedCount} já existia(m) no mês.`
        );
        setSubmitting(false);
        router.refresh();
      } catch {
        setFeedback("Erro inesperado ao aplicar. Tente novamente.");
        setSubmitting(false);
      }
    })();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.8))] p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700 dark:text-indigo-300">
              <Repeat className="size-3.5" />
              Templates recorrentes
            </div>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">
              Automatize as contas que se repetem.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Crie templates (aluguel, internet, energia) e aplique no mês selecionado com um clique.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <MonthSelector monthKey={monthKey} />
            <div className="rounded-3xl border border-border/60 bg-background/75 px-4 py-3 text-right backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                mês selecionado
              </div>
              <div className="mt-1 text-xl font-semibold tracking-[-0.04em] text-foreground">
                {formatMonthLabel(monthKey)}
              </div>
            </div>
            <Button variant="outline" onClick={handleApplyToMonth} disabled={submitting}>
              <CalendarDays className="mr-2 size-4" />
              Aplicar recorrências no mês
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg tracking-[-0.03em]">
              <Plus className="size-4 text-indigo-600 dark:text-indigo-400" />
              {editingId ? "Editar template" : "Novo template"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rec-amount" className="text-sm font-semibold text-foreground">
                    Valor
                  </Label>
                  <Input
                    id="rec-amount"
                    placeholder="Ex.: 249,90"
                    value={form.amount}
                    onChange={(event) => setForm((c) => ({ ...c, amount: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-desc" className="text-sm font-semibold text-foreground">
                    Descrição
                  </Label>
                  <Input
                    id="rec-desc"
                    placeholder="Ex.: aluguel"
                    value={form.descricao}
                    onChange={(event) => setForm((c) => ({ ...c, descricao: event.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rec-cat" className="text-sm font-semibold text-foreground">
                    Categoria
                  </Label>
                  <select
                    id="rec-cat"
                    value={form.categoriaId}
                    onChange={(event) => setForm((c) => ({ ...c, categoriaId: event.target.value }))}
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
                  <Label htmlFor="rec-policy" className="text-sm font-semibold text-foreground">
                    Política de visita
                  </Label>
                  <select
                    id="rec-policy"
                    value={form.visitaPolitica}
                    onChange={(event) =>
                      setForm((c) => ({
                        ...c,
                        visitaPolitica: event.target.value as RecurringFormState["visitaPolitica"],
                      }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="none">Ignorar visita (pontual)</option>
                    <option value="during">Durante a visita</option>
                    <option value="month">Mês inteiro (mensal)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 rounded-3xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="rec-split" className="text-sm font-semibold text-foreground">
                      Split entre moradores
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Defina a divisão base do template. A visita ajusta por cima, quando aplicável.
                    </p>
                  </div>
                  <div className="text-right text-sm font-semibold text-foreground">
                    <div>
                      {form.splitMorador1}% / {form.splitMorador2}%
                    </div>
                  </div>
                </div>

                <input
                  id="rec-split"
                  type="range"
                  min={0}
                  max={100}
                  value={form.splitMorador1}
                  onChange={(event) => handleSplitChange(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-indigo-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rec-active" className="text-sm font-semibold text-foreground">
                    Ativo
                  </Label>
                  <select
                    id="rec-active"
                    value={form.ativo ? "true" : "false"}
                    onChange={(event) => setForm((c) => ({ ...c, ativo: event.target.value === "true" }))}
                    className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="true">Sim (sugerir todo mês)</option>
                    <option value="false">Não (guardar, sem aplicar)</option>
                  </select>
                </div>
                <div className="hidden sm:block" />
              </div>

              {feedback ? (
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm font-medium text-foreground">
                  {feedback}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={submitting}>
                  {editingId ? "Salvar alterações" : "Criar template"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    Cancelar edição
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="text-lg tracking-[-0.03em]">Templates cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedTemplates.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-background/70 px-4 py-5 text-sm leading-6 text-muted-foreground">
                Nenhum template cadastrado. Crie o primeiro para aplicar automaticamente no mês.
              </div>
            ) : (
              sortedTemplates.map((template) => (
                <div key={template.id} className="rounded-3xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{template.descricao}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {categoryMap.get(template.categoriaId) ?? "Sem categoria"} · split{" "}
                        {template.split["user-1"] ?? 0}% / {template.split["user-2"] ?? 0}%
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {template.ativo ? "ativo" : "inativo"} · visita{" "}
                        {template.visitaPolitica ?? "month"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(template.valor)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() => handleEdit(template)}
                          disabled={submitting}
                          className={cn(
                            editingId === template.id &&
                              "border-indigo-500/60 text-indigo-700 dark:text-indigo-300"
                          )}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() => handleDelete(template.id, template.descricao)}
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

      {users.length !== 2 ? (
        <div className="rounded-3xl border border-border/60 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
          O app foi desenhado para 2 moradores. Se a lista de usuários mudar, revise o split dos templates.
        </div>
      ) : null}
    </div>
  );
}

