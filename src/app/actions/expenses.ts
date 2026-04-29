"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { addExpense, deleteExpense, getExpenses, setExpenses } from "@/lib/kv/expenses";
import { resolveMonthKey } from "@/lib/month";
import { getGuests } from "@/lib/kv/guests";
import { expenseSchema } from "@/lib/schemas";
import { addLog } from "@/lib/kv/logs";
import { resolveActiveGuest, resolveBestGuestForMonth } from "@/lib/finance/visits";
import { prevMonthKey } from "@/lib/finance/balances";
import type { ActionResult, Expense } from "@/types";

function revalidateExpenseViews() {
  revalidatePath("/");
  revalidatePath("/despesas");
}

interface ExpenseActionInput {
  amount: string;
  data: string;
  visitaPolitica?: "none" | "during" | "month";
  descricao: string;
  categoriaId: string;
  pagadorId: string;
  splitMorador1: number;
  splitMorador2: number;
}

async function resolveVisitId(
  monthKey: string,
  expenseDate: string,
  policy: "none" | "during" | "month"
) {
  const [guestsThisMonth, guestsPrevMonth] = await Promise.all([
    getGuests(monthKey),
    getGuests(prevMonthKey(monthKey)),
  ]);

  const allGuests = [...guestsThisMonth, ...guestsPrevMonth];
  if (policy === "none") return undefined;
  if (policy === "month") return resolveBestGuestForMonth(allGuests, monthKey)?.id;
  return resolveActiveGuest(allGuests, expenseDate)?.id;
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
    data: input.data,
    visitaPolitica: input.visitaPolitica,
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
  const visitaPolitica = parsed.data.visitaPolitica ?? "during";
  const visitaId = await resolveVisitId(
    monthKey,
    parsed.data.data ?? now.slice(0, 10),
    visitaPolitica
  );
  const expense: Expense = {
    id: crypto.randomUUID(),
    descricao: parsed.data.descricao,
    valor: parsed.data.valor,
    data: parsed.data.data,
    visitaPolitica,
    categoriaId: parsed.data.categoriaId,
    pagadorId: parsed.data.pagadorId,
    split: parsed.data.split,
    visitaId,
    criadoPor: session.user.id,
    criadoEm: now,
    atualizadoEm: now,
  };

  await addExpense(monthKey, expense);
  
  await addLog({
    userId: session.user.id,
    userName: session.user.name ?? "Usuário",
    actionType: "CREATE",
    entityName: "Despesa",
    description: `Adicionou a despesa "${expense.descricao}" no valor de R$ ${(expense.valor / 100).toFixed(2)}`,
  });

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

  const visitaPolitica = parsed.data.visitaPolitica ?? expenses[index].visitaPolitica ?? "during";
  const expenseDate =
    parsed.data.data ?? expenses[index].data ?? expenses[index].criadoEm.slice(0, 10);
  const visitaId = await resolveVisitId(monthKey, expenseDate, visitaPolitica);

  const updatedExpense: Expense = {
    ...expenses[index],
    descricao: parsed.data.descricao,
    valor: parsed.data.valor,
    data: parsed.data.data,
    visitaPolitica,
    categoriaId: parsed.data.categoriaId,
    pagadorId: parsed.data.pagadorId,
    split: parsed.data.split,
    visitaId,
    atualizadoEm: new Date().toISOString(),
  };

  expenses[index] = updatedExpense;
  await setExpenses(monthKey, expenses);

  await addLog({
    userId: session.user.id,
    userName: session.user.name ?? "Usuário",
    actionType: "UPDATE",
    entityName: "Despesa",
    description: `Editou a despesa "${updatedExpense.descricao}" no valor de R$ ${(updatedExpense.valor / 100).toFixed(2)}`,
  });

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

  const monthKey = resolveMonthKey(monthKeyInput);
  const expenses = await getExpenses(monthKey);
  const expense = expenses.find((e) => e.id === expenseId);

  const deleted = await deleteExpense(monthKey, expenseId);
  if (!deleted) {
    return { success: false, error: "Despesa não encontrada." };
  }

  if (expense) {
    await addLog({
      userId: session.user.id,
      userName: session.user.name ?? "Usuário",
      actionType: "DELETE",
      entityName: "Despesa",
      description: `Excluiu a despesa "${expense.descricao}"`,
    });
  }

  revalidateExpenseViews();
  return { success: true };
}
