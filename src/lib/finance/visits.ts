import type { Expense, Guest } from "@/types";

export type VisitPolicy = "none" | "during" | "month";

export function getDaysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function overlapDaysInclusive(
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

export function resolveActiveGuest(guests: Guest[], expenseDate: string) {
  const candidates = guests.filter(
    (guest) => expenseDate >= guest.dataInicio && expenseDate <= guest.dataFim
  );
  if (candidates.length === 0) return null;
  // Prefer the most recent start date when periods overlap.
  return candidates.sort((a, b) => b.dataInicio.localeCompare(a.dataInicio))[0] ?? null;
}

export function resolveBestGuestForMonth(guests: Guest[], monthKey: string, visitaId?: string) {
  if (visitaId) {
    const byId = guests.find((guest) => guest.id === visitaId);
    if (byId) return byId;
  }

  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, getDaysInMonth(monthKey));

  const overlaps = guests
    .map((guest) => {
      const start = new Date(`${guest.dataInicio}T00:00:00`);
      const end = new Date(`${guest.dataFim}T00:00:00`);
      return { guest, days: overlapDaysInclusive(start, end, monthStart, monthEnd) };
    })
    .filter((item) => item.days > 0)
    .sort((a, b) => b.days - a.days || b.guest.dataInicio.localeCompare(a.guest.dataInicio));

  return overlaps[0]?.guest ?? null;
}

export function computeVisitorCostForExpense(
  expense: Pick<Expense, "valor" | "data" | "criadoEm" | "visitaPolitica" | "visitaId" | "split">,
  monthKey: string,
  guests: Guest[]
): { visitorCost: number; hostId: string; guestId: string } | null {
  const policy: VisitPolicy = (expense.visitaPolitica ?? "during") as VisitPolicy;
  if (policy === "none") return null;

  const expenseISODate = expense.data ?? new Date(expense.criadoEm).toISOString().slice(0, 10);
  const guest =
    policy === "month"
      ? resolveBestGuestForMonth(guests, monthKey, expense.visitaId)
      : resolveActiveGuest(guests, expenseISODate);

  if (!guest) return null;

  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, getDaysInMonth(monthKey));
  const guestStart = new Date(`${guest.dataInicio}T00:00:00`);
  const guestEnd = new Date(`${guest.dataFim}T00:00:00`);
  const daysInMonth = getDaysInMonth(monthKey);
  const daysOfVisitInMonth = overlapDaysInclusive(guestStart, guestEnd, monthStart, monthEnd);
  if (daysOfVisitInMonth <= 0) return null;

  const numberOfResidents = Object.keys(expense.split).length || 2;
  const visitorCost = Math.round(
    (expense.valor * (daysOfVisitInMonth / daysInMonth)) / (numberOfResidents + 1)
  );

  return { visitorCost, hostId: guest.hostId, guestId: guest.id };
}

export function computeOwedByUserForExpense(
  expense: Pick<
    Expense,
    "valor" | "data" | "criadoEm" | "split" | "visitaPolitica" | "visitaId"
  >,
  monthKey: string,
  guests: Guest[]
): Record<string, number> {
  const policy: VisitPolicy = (expense.visitaPolitica ?? "during") as VisitPolicy;
  if (policy === "none") {
    return Object.fromEntries(
      Object.entries(expense.split).map(([userId, percent]) => [
        userId,
        Math.round((expense.valor * percent) / 100),
      ])
    );
  }

  const visitor = computeVisitorCostForExpense(expense, monthKey, guests);
  if (!visitor) {
    return Object.fromEntries(
      Object.entries(expense.split).map(([userId, percent]) => [
        userId,
        Math.round((expense.valor * percent) / 100),
      ])
    );
  }

  const remainder = expense.valor - visitor.visitorCost;
  const owed: Record<string, number> = {};
  let remainderAllocated = 0;
  for (const [userId, percent] of Object.entries(expense.split)) {
    const portion = Math.round((remainder * percent) / 100);
    owed[userId] = (owed[userId] ?? 0) + portion;
    remainderAllocated += portion;
  }

  const roundingDiff = remainder - remainderAllocated;
  owed[visitor.hostId] = (owed[visitor.hostId] ?? 0) + visitor.visitorCost + roundingDiff;
  return owed;
}

