"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { addRecurring, deleteRecurring, getRecurring, updateRecurring } from "@/lib/kv/recurring";
import { addExpense, getExpenses } from "@/lib/kv/expenses";
import { resolveMonthKey } from "@/lib/month";
import { recurringSchema } from "@/lib/schemas";
import type { ActionResult, Expense, RecurringTemplate } from "@/types";

interface RecurringActionInput {
  descricao: string;
  amount: string;
  categoriaId: string;
  splitMorador1: number;
  splitMorador2: number;
  ativo: boolean;
  visitaPolitica?: "none" | "during" | "month";
}

function revalidateRecurringViews() {
  revalidatePath("/");
  revalidatePath("/recorrentes");
  revalidatePath("/despesas");
}

function parseRecurringInput(input: RecurringActionInput) {
  const amountValue = Number(input.amount.replace(/[\.\s]/g, "").replace(",", "."));
  const valor = Math.round(amountValue * 100);
  const split = {
    "user-1": input.splitMorador1,
    "user-2": input.splitMorador2,
  };

  return recurringSchema.safeParse({
    descricao: input.descricao.trim(),
    valor,
    categoriaId: input.categoriaId,
    split,
    ativo: input.ativo,
    visitaPolitica: input.visitaPolitica,
  });
}

export async function createRecurringAction(
  input: RecurringActionInput
): Promise<ActionResult<RecurringTemplate>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autorizado" };

  const parsed = parseRecurringInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const templates = await getRecurring();
  const duplicate = templates.some(
    (template) => template.descricao.trim().toLowerCase() === parsed.data.descricao.toLowerCase()
  );
  if (duplicate) {
    return { success: false, error: "Já existe um template com essa descrição." };
  }

  const template: RecurringTemplate = {
    id: `rec-${crypto.randomUUID().slice(0, 10)}`,
    descricao: parsed.data.descricao,
    valor: parsed.data.valor,
    categoriaId: parsed.data.categoriaId,
    split: parsed.data.split,
    ativo: parsed.data.ativo,
    visitaPolitica: parsed.data.visitaPolitica,
  };

  await addRecurring(template);
  revalidateRecurringViews();
  return { success: true, data: template };
}

export async function updateRecurringAction(
  templateId: string,
  input: RecurringActionInput
): Promise<ActionResult<RecurringTemplate>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autorizado" };

  const parsed = parseRecurringInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const templates = await getRecurring();
  const duplicate = templates.some(
    (template) =>
      template.id !== templateId &&
      template.descricao.trim().toLowerCase() === parsed.data.descricao.toLowerCase()
  );
  if (duplicate) {
    return { success: false, error: "Já existe um template com essa descrição." };
  }

  const updated = await updateRecurring(templateId, {
    descricao: parsed.data.descricao,
    valor: parsed.data.valor,
    categoriaId: parsed.data.categoriaId,
    split: parsed.data.split,
    ativo: parsed.data.ativo,
    visitaPolitica: parsed.data.visitaPolitica,
  });

  if (!updated) return { success: false, error: "Template não encontrado." };

  revalidateRecurringViews();
  return { success: true, data: updated };
}

export async function deleteRecurringAction(templateId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autorizado" };

  const deleted = await deleteRecurring(templateId);
  if (!deleted) return { success: false, error: "Template não encontrado." };

  revalidateRecurringViews();
  return { success: true };
}

export async function applyRecurringToMonthAction(
  monthKeyInput?: string
): Promise<ActionResult<{ created: Expense[]; skipped: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autorizado" };

  const monthKey = resolveMonthKey(monthKeyInput);
  const [templates, expenses] = await Promise.all([getRecurring(), getExpenses(monthKey)]);
  const activeTemplates = templates.filter((template) => template.ativo);

  const existingSignatures = new Set(
    expenses.map((expense) => `${expense.descricao}|${expense.categoriaId}|${expense.valor}`)
  );

  const created: Expense[] = [];
  let skipped = 0;
  const now = new Date().toISOString();

  for (const template of activeTemplates) {
    const signature = `${template.descricao}|${template.categoriaId}|${template.valor}`;
    if (existingSignatures.has(signature)) {
      skipped += 1;
      continue;
    }

    const expense: Expense = {
      id: crypto.randomUUID(),
      descricao: template.descricao,
      valor: template.valor,
      data: `${monthKey}-01`,
      visitaPolitica: template.visitaPolitica ?? "month",
      categoriaId: template.categoriaId,
      pagadorId: session.user.id,
      split: template.split,
      criadoPor: session.user.id,
      criadoEm: now,
      atualizadoEm: now,
    };

    await addExpense(monthKey, expense);
    existingSignatures.add(signature);
    created.push(expense);
  }

  revalidateRecurringViews();
  return { success: true, data: { created, skipped } };
}

