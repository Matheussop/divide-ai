import { kv } from "@vercel/kv";
import type { MonthlyBalance } from "@/types";

const key = (month: string) => `balances:${month}`;

export async function getBalance(month: string): Promise<MonthlyBalance | null> {
  return kv.get<MonthlyBalance>(key(month));
}

export async function setBalance(
  month: string,
  balance: MonthlyBalance
): Promise<void> {
  await kv.set(key(month), balance);
}

export async function getMonthsWithData(): Promise<string[]> {
  return (await kv.get<string[]>("months-with-data")) ?? [];
}

export async function addMonthWithData(month: string): Promise<void> {
  const months = await getMonthsWithData();
  if (!months.includes(month)) {
    months.push(month);
    months.sort();
    await kv.set("months-with-data", months);
  }
}
