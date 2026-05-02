import { computeOwedByUserForExpense, computeVisitorCostsForExpense } from "@/lib/finance/visits";
import type { Expense, Guest, User } from "@/types";

export function computeMonthlyBreakdown(
  expenses: Expense[],
  monthKey: string,
  guests: Guest[],
  users: User[]
) {
  const paid: Record<string, number> = {};
  const baseOwed: Record<string, number> = {};
  const visitorCost: Record<string, number> = {};
  const net: Record<string, number> = {};

  for (const expense of expenses) {
    paid[expense.pagadorId] = (paid[expense.pagadorId] ?? 0) + expense.valor;

    const visitors = computeVisitorCostsForExpense(expense, monthKey, guests);
    for (const visitor of visitors) {
      visitorCost[visitor.hostId] = (visitorCost[visitor.hostId] ?? 0) + visitor.visitorCost;
    }

    const owed = computeOwedByUserForExpense(expense, monthKey, guests);
    for (const [userId, amount] of Object.entries(owed)) {
      const extraForVisit = visitors
        .filter((visitor) => visitor.hostId === userId)
        .reduce((sum, visitor) => sum + visitor.visitorCost, 0);
      baseOwed[userId] = (baseOwed[userId] ?? 0) + (amount - extraForVisit);
    }
  }

  for (const user of users) {
    const p = paid[user.id] ?? 0;
    const b = baseOwed[user.id] ?? 0;
    const v = visitorCost[user.id] ?? 0;
    net[user.id] = p - (b + v);
  }

  return { paid, baseOwed, visitorCost, net };
}
