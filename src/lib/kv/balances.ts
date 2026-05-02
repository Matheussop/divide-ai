import { getJSON, setJSON, getKeys } from "@/lib/redis";
import type { MonthlyBalance } from "@/types";

const key = (month: string) => `balances:${month}`;

export async function getBalance(month: string): Promise<MonthlyBalance | null> {
  return getJSON<MonthlyBalance>(key(month));
}

export async function setBalance(
  month: string,
  balance: MonthlyBalance
): Promise<void> {
  await setJSON(key(month), balance);
}

export async function getMonthsWithData(): Promise<string[]> {
  const keys = await getKeys("expenses:*");
  const months = keys.map((k) => k.replace("expenses:", ""));
  return months.sort().reverse(); // Sort descending
}

