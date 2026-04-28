"use client";

import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/ui/icon-picker";
import { LUCIDE_ICON_OPTIONS, lucideIconMap } from "@/lib/lucide-icons";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import { useRouter } from "next/navigation";

interface CategoriesManagerProps {
  categories: Category[];
}

interface CategoryFormState {
  nome: string;
  icone: string;
}

const initialForm: CategoryFormState = {
  nome: "",
  icone: LUCIDE_ICON_OPTIONS[0]?.value ?? "package",
};

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [categories]
  );

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFeedback("");

    void (async () => {
      try {
        const result = editingId
          ? await updateCategoryAction(editingId, form)
          : await createCategoryAction(form);

        if (!result.success) {
          setFeedback(result.error ?? "Nao foi possivel salvar a categoria.");
          setSubmitting(false);
          return;
        }

        setFeedback(editingId ? "Categoria atualizada." : "Categoria criada.");
        resetForm();
        setSubmitting(false);
        router.refresh();
      } catch {
        setFeedback("Erro inesperado. Tente novamente.");
        setSubmitting(false);
      }
    })();
  }

  function handleEdit(category: Category) {
    setEditingId(category.id);
    setFeedback("");
    setForm({
      nome: category.nome,
      icone: category.icone,
    });
  }

  function handleDelete(categoryId: string, categoryName: string) {
    const confirmed = window.confirm(
      `Excluir a categoria "${categoryName}"? Essa acao nao remove despesas antigas.`
    );
    if (!confirmed) return;

    setSubmitting(true);
    setFeedback("");

    void (async () => {
      try {
        const result = await deleteCategoryAction(categoryId);
        if (!result.success) {
          setFeedback(result.error ?? "Nao foi possivel excluir a categoria.");
          setSubmitting(false);
          return;
        }

        if (editingId === categoryId) {
          resetForm();
        }

        setFeedback("Categoria excluida.");
        setSubmitting(false);
        router.refresh();
      } catch {
        setFeedback("Erro inesperado ao excluir. Tente novamente.");
        setSubmitting(false);
      }
    })();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.17),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.8))] p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
              Categorias
            </div>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">
              Personalize as categorias que organizam seu mes.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Essas categorias alimentam o cadastro de despesas e o resumo do dashboard.
            </p>
          </div>
          <div className="rounded-3xl border border-border/60 bg-background/75 px-4 py-3 text-right backdrop-blur-sm">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              total de categorias
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-foreground">
              {categories.length}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg tracking-[-0.03em]">
              <Plus className="size-4 text-emerald-600 dark:text-emerald-400" />
              {editingId ? "Editar categoria" : "Nova categoria"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="category-name" className="text-sm font-semibold text-foreground">
                  Nome
                </Label>
                <Input
                  id="category-name"
                  placeholder="Ex.: Farmacia"
                  value={form.nome}
                  onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-icon" className="text-sm font-semibold text-foreground">
                  Icone
                </Label>
                <IconPicker
                  label="Ícone"
                  value={form.icone}
                  onChange={(nextValue) =>
                    setForm((current) => ({ ...current, icone: nextValue }))
                  }
                  options={LUCIDE_ICON_OPTIONS}
                  disabled={submitting}
                />
              </div>

              {feedback ? (
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm font-medium text-foreground">
                  {feedback}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={submitting}>
                  {editingId ? "Salvar alteracoes" : "Criar categoria"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    Cancelar edicao
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="text-lg tracking-[-0.03em]">Categorias cadastradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedCategories.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-background/70 px-4 py-5 text-sm leading-6 text-muted-foreground">
                Nenhuma categoria encontrada. Crie sua primeira categoria para aparecer no cadastro de despesas.
              </div>
            ) : (
              sortedCategories.map((category) => {
                const Icon = lucideIconMap[category.icone] ?? Package;

                return (
                  <div key={category.id} className="rounded-3xl border border-border/60 bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-border/60 bg-card px-2.5 py-2 text-foreground">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{category.nome}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            {category.icone}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() => handleEdit(category)}
                          disabled={submitting}
                          className={cn(
                            editingId === category.id &&
                            "border-emerald-500/60 text-emerald-700 dark:text-emerald-300"
                          )}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() => handleDelete(category.id, category.nome)}
                          disabled={submitting}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
