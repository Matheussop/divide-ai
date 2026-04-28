"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { addExpense, deleteExpense, getExpenses, setExpenses } from "@/lib/kv/expenses";
import { resolveMonthKey } from "@/lib/month";
import { getGuests } from "@/lib/kv/guests";
import { expenseSchema } from "@/lib/schemas";
import type { ActionResult, Expense, Guest } from "@/types";

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

function prevMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDaysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function overlapDaysInclusive(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date
): number {
  const clampedStart = start > rangeStart ? start : rangeStart;
  const clampedEnd = end < rangeEnd ? end : rangeEnd;
  if (clampedEnd < clampedStart) return 0;
  const diffMs = clampedEnd.getTime() - clampedStart.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

function resolveActiveGuest(guests: Guest[], expenseDate: string) {
  const candidates = guests.filter(
    (guest) => expenseDate >= guest.dataInicio && expenseDate <= guest.dataFim
  );
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.dataInicio.localeCompare(a.dataInicio))[0] ?? null;
}

function resolveBestGuestForMonth(guests: Guest[], monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, getDaysInMonth(monthKey));

  const overlaps = guests
    .map((guest) => {
      const start = new Date(`${guest.dataInicio}T00:00:00`);
      const end = new Date(`${guest.dataFim}T00:00:00`);
      return {
        guest,
        days: overlapDaysInclusive(start, end, monthStart, monthEnd),
      };
    })
    .filter((item) => item.days > 0)
    .sort((a, b) => b.days - a.days || b.guest.dataInicio.localeCompare(a.guest.dataInicio));

  return overlaps[0]?.guest ?? null;
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
