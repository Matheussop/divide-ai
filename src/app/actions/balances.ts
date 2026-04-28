"use server";

import { auth } from "@/lib/auth";
import { getExpenses } from "@/lib/kv/expenses";
import { getGuests } from "@/lib/kv/guests";
import { getBalance, setBalance } from "@/lib/kv/balances";
import { resolveMonthKey } from "@/lib/month";
import { calculateMonthBalance, prevMonthKey } from "@/lib/finance/balances";
import type { ActionResult, MonthlyBalance } from "@/types";

export async function computeAndStoreBalanceAction(
  monthKeyInput?: string
): Promise<ActionResult<MonthlyBalance>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autorizado" };

  const monthKey = resolveMonthKey(monthKeyInput);
  const previousMonthKey = prevMonthKey(monthKey);

  const [expenses, guestsThisMonth, guestsPrevMonth, previousBalance] = await Promise.all([
    getExpenses(monthKey),
    getGuests(monthKey),
    getGuests(previousMonthKey),
    getBalance(previousMonthKey),
  ]);

  const saldoAnterior = previousBalance?.saldoFinal ?? 0;
  const balance = calculateMonthBalance(monthKey, expenses, [...guestsThisMonth, ...guestsPrevMonth], saldoAnterior);
  await setBalance(monthKey, balance);

  return { success: true, data: balance };
}

