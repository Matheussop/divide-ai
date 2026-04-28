import { getJSON, setJSON } from "@/lib/redis";
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
  return (await getJSON<string[]>("months-with-data")) ?? [];
}

export async function addMonthWithData(month: string): Promise<void> {
  const months = await getMonthsWithData();
  if (!months.includes(month)) {
    months.push(month);
    months.sort();
    await setJSON("months-with-data", months);
  }
}
