"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { addExpense, deleteExpense, getExpenses, setExpenses } from "@/lib/kv/expenses";
import { resolveMonthKey } from "@/lib/month";
import { expenseSchema } from "@/lib/schemas";
import type { ActionResult, Expense } from "@/types";

function revalidateExpenseViews() {
  revalidatePath("/");
  revalidatePath("/despesas");
}

interface ExpenseActionInput {
  amount: string;
  descricao: string;
  categoriaId: string;
  pagadorId: string;
  splitMorador1: number;
  splitMorador2: number;
}

function parseExpenseInput(input: ExpenseActionInput) {
  const amountValue = Number(input.amount.replace(/[\.\s]/g, "").replace(",", "."));
  const valor = Math.round(amountValue * 100);
  const split = {
    "user-1": input.splitMorador1,
    "user-2": input.splitMorador2,
  };

  return expenseSchema.safeParse({
    valor,
    descricao: input.descricao,
    categoriaId: input.categoriaId,
    pagadorId: input.pagadorId,
    split,
  });
}

export async function createExpenseAction(
  input: ExpenseActionInput,
  monthKeyInput?: string
): Promise<ActionResult<Expense>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const parsed = parseExpenseInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const totalSplit = Object.values(parsed.data.split).reduce((sum, value) => sum + value, 0);
  if (totalSplit !== 100) {
    return { success: false, error: "O split precisa somar 100%." };
  }

  const now = new Date().toISOString();
  const monthKey = resolveMonthKey(monthKeyInput);
  const expense: Expense = {
    id: crypto.randomUUID(),
    descricao: parsed.data.descricao,
    valor: parsed.data.valor,
    categoriaId: parsed.data.categoriaId,
    pagadorId: parsed.data.pagadorId,
    split: parsed.data.split,
    criadoPor: session.user.id,
    criadoEm: now,
    atualizadoEm: now,
  };

  await addExpense(monthKey, expense);
  revalidateExpenseViews();
  return { success: true, data: expense };
}

export async function updateExpenseAction(
  expenseId: string,
  input: ExpenseActionInput,
  monthKeyInput?: string
): Promise<ActionResult<Expense>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const parsed = parseExpenseInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const totalSplit = Object.values(parsed.data.split).reduce((sum, value) => sum + value, 0);
  if (totalSplit !== 100) {
    return { success: false, error: "O split precisa somar 100%." };
  }

  const monthKey = resolveMonthKey(monthKeyInput);
  const expenses = await getExpenses(monthKey);
  const index = expenses.findIndex((expense) => expense.id === expenseId);
  if (index === -1) {
    return { success: false, error: "Despesa não encontrada." };
  }

  const updatedExpense: Expense = {
    ...expenses[index],
    descricao: parsed.data.descricao,
    valor: parsed.data.valor,
    categoriaId: parsed.data.categoriaId,
    pagadorId: parsed.data.pagadorId,
    split: parsed.data.split,
    atualizadoEm: new Date().toISOString(),
  };

  expenses[index] = updatedExpense;
  await setExpenses(monthKey, expenses);
  revalidateExpenseViews();
  return { success: true, data: updatedExpense };
}

export async function deleteExpenseAction(
  expenseId: string,
  monthKeyInput?: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const deleted = await deleteExpense(resolveMonthKey(monthKeyInput), expenseId);
  if (!deleted) {
    return { success: false, error: "Despesa não encontrada." };
  }

  revalidateExpenseViews();
  return { success: true };
}
