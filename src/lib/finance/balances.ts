import { getKeys, getJSON } from "@/lib/redis";
import type { Expense, Guest, MonthlyBalance } from "@/types";
import { computeOwedByUserForExpense } from "@/lib/finance/visits";

export function prevMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getAccumulatedNetBalances(untilMonthKey: string): Promise<Record<string, number>> {
  const keys = await getKeys("expenses:*");
  const monthKeys = keys.map((k) => k.replace("expenses:", "")).filter((m) => m < untilMonthKey);

  const netByUser: Record<string, number> = {};

  for (const month of monthKeys) {
    const expenses = (await getJSON<Expense[]>(`expenses:${month}`)) ?? [];
    const guests = (await getJSON<Guest[]>(`guests:${month}`)) ?? [];

    for (const expense of expenses) {
      netByUser[expense.pagadorId] = (netByUser[expense.pagadorId] ?? 0) + expense.valor;

      const owedForExpense = computeOwedByUserForExpense(expense, month, guests);
      for (const [userId, amount] of Object.entries(owedForExpense)) {
        netByUser[userId] = (netByUser[userId] ?? 0) - amount;
      }
    }
  }

  return netByUser;
}

export function calculateMonthBalance(
  monthKey: string,
  expenses: Expense[],
  guests: Guest[],
  saldoAnterior: number
): MonthlyBalance {
  const paidByUser: Record<string, number> = {};
  const owedByUser: Record<string, number> = {};

  for (const expense of expenses) {
    paidByUser[expense.pagadorId] = (paidByUser[expense.pagadorId] ?? 0) + expense.valor;

    const owedForExpense = computeOwedByUserForExpense(expense, monthKey, guests);
    for (const [userId, amount] of Object.entries(owedForExpense)) {
      owedByUser[userId] = (owedByUser[userId] ?? 0) + amount;
    }
  }

  const users = Array.from(new Set([...Object.keys(paidByUser), ...Object.keys(owedByUser)]));
  const porPessoa = Object.fromEntries(
    users.map((userId) => [
      userId,
      {
        pagou: paidByUser[userId] ?? 0,
        deve: owedByUser[userId] ?? 0,
      },
    ])
  );

  // saldoFinal: positivo = user1 deve para user2 (regra já descrita no types)
  // Para 2 usuários, podemos computar como net(user-2) - net(user-1) (ou vice-versa),
  // mas mantemos genérico: saldoFinal = soma(nets positivos?) — aqui guardamos o gap do primeiro para o último.
  const netByUser = Object.fromEntries(
    users.map((userId) => [userId, (paidByUser[userId] ?? 0) - (owedByUser[userId] ?? 0)])
  );
  const sorted = Object.entries(netByUser).sort((a, b) => b[1] - a[1]);
  const saldoMes = sorted.length >= 2 ? sorted[0][1] : sorted[0]?.[1] ?? 0;

  return {
    mes: monthKey,
    saldoAnterior,
    totalGasto: expenses.reduce((sum, expense) => sum + expense.valor, 0),
    porPessoa,
    saldoFinal: saldoAnterior + saldoMes,
    calculadoEm: new Date().toISOString(),
  };
}

