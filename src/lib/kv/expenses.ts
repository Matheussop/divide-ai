import { kv } from "@vercel/kv";
import type { Expense } from "@/types";

const key = (month: string) => `expenses:${month}`;

export async function getExpenses(month: string): Promise<Expense[]> {
  return (await kv.get<Expense[]>(key(month))) ?? [];
}

export async function setExpenses(
  month: string,
  expenses: Expense[]
): Promise<void> {
  await kv.set(key(month), expenses);
}

export async function addExpense(
  month: string,
  expense: Expense
): Promise<void> {
  const expenses = await getExpenses(month);
  expenses.push(expense);
  await setExpenses(month, expenses);
}

export async function updateExpense(
  month: string,
  id: string,
  data: Partial<Expense>
): Promise<Expense | null> {
  const expenses = await getExpenses(month);
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) return null;

  expenses[index] = { ...expenses[index], ...data, atualizadoEm: new Date().toISOString() };
  await setExpenses(month, expenses);
  return expenses[index];
}

export async function deleteExpense(
  month: string,
  id: string
): Promise<boolean> {
  const expenses = await getExpenses(month);
  const filtered = expenses.filter((e) => e.id !== id);
  if (filtered.length === expenses.length) return false;

  await setExpenses(month, filtered);
  return true;
}
