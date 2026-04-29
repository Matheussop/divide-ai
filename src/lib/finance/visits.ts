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
  const candidates = guests.filter((guest) =>
    guest.periodos.some((p) => expenseDate >= p.dataInicio && expenseDate <= p.dataFim)
  );
  if (candidates.length === 0) return null;
  // Prefer the most recent start date (taking the first period of each guest for sorting)
  return candidates.sort((a, b) => b.periodos[0].dataInicio.localeCompare(a.periodos[0].dataInicio))[0] ?? null;
}

/** Returns ALL guests that are active on the given expense date. */
export function resolveAllActiveGuests(guests: Guest[], expenseDate: string): Guest[] {
  return guests.filter((guest) =>
    guest.periodos.some((p) => expenseDate >= p.dataInicio && expenseDate <= p.dataFim)
  );
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
      const days = guest.periodos.reduce((total, p) => {
        const start = new Date(`${p.dataInicio}T00:00:00`);
        const end = new Date(`${p.dataFim}T00:00:00`);
        return total + overlapDaysInclusive(start, end, monthStart, monthEnd);
      }, 0);
      return { guest, days };
    })
    .filter((item) => item.days > 0)
    .sort((a, b) => b.days - a.days || b.guest.periodos[0].dataInicio.localeCompare(a.guest.periodos[0].dataInicio));

  return overlaps[0]?.guest ?? null;
}

/** Returns ALL guests that have any overlap in the given month. */
export function resolveAllGuestsForMonth(guests: Guest[], monthKey: string): Guest[] {
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, getDaysInMonth(monthKey));

  return guests.filter((guest) =>
    guest.periodos.some((p) => {
      const start = new Date(`${p.dataInicio}T00:00:00`);
      const end = new Date(`${p.dataFim}T00:00:00`);
      return overlapDaysInclusive(start, end, monthStart, monthEnd) > 0;
    })
  );
}

/** @deprecated Use computeVisitorCostsForExpense (returns all repasses). Kept for compatibility. */
export function computeVisitorCostForExpense(
  expense: Pick<Expense, "valor" | "data" | "criadoEm" | "visitaPolitica" | "visitaId" | "split">,
  monthKey: string,
  guests: Guest[]
): { visitorCost: number; hostId: string; guestId: string } | null {
  const results = computeVisitorCostsForExpense(expense, monthKey, guests);
  return results[0] ?? null;
}

/**
 * Computes the repasse for every active guest in the expense's applicable period.
 * Returns one entry per guest. The total visitor cost deducted from the shared pool
 * is the sum of all entries.
 */
export function computeVisitorCostsForExpense(
  expense: Pick<Expense, "valor" | "data" | "criadoEm" | "visitaPolitica" | "visitaId" | "split">,
  monthKey: string,
  guests: Guest[]
): { visitorCost: number; hostId: string; guestId: string }[] {
  const policy: VisitPolicy = (expense.visitaPolitica ?? "during") as VisitPolicy;
  if (policy === "none") return [];

  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, getDaysInMonth(monthKey));
  const daysInMonth = getDaysInMonth(monthKey);
  const numberOfResidents = Object.keys(expense.split).length || 2;

  let activeGuests: Guest[];

  if (policy === "month") {
    // Always use all guests with overlap in the month — visitaId is legacy and ignored here
    activeGuests = resolveAllGuestsForMonth(guests, monthKey);
  } else {
    // "during" policy: all guests active on the expense date
    const expenseISODate = expense.data ?? new Date(expense.criadoEm).toISOString().slice(0, 10);
    activeGuests = resolveAllActiveGuests(guests, expenseISODate);
  }

  if (activeGuests.length === 0) return [];

  const results: { visitorCost: number; hostId: string; guestId: string }[] = [];

  for (const guest of activeGuests) {
    let daysOfVisit: number;

    if (policy === "month") {
      daysOfVisit = guest.periodos.reduce((total, p) => {
        const start = new Date(`${p.dataInicio}T00:00:00`);
        const end = new Date(`${p.dataFim}T00:00:00`);
        return total + overlapDaysInclusive(start, end, monthStart, monthEnd);
      }, 0);
    } else {
      // "during": only count the days of this guest that overlap the month
      daysOfVisit = guest.periodos.reduce((total, p) => {
        const start = new Date(`${p.dataInicio}T00:00:00`);
        const end = new Date(`${p.dataFim}T00:00:00`);
        return total + overlapDaysInclusive(start, end, monthStart, monthEnd);
      }, 0);
    }

    if (daysOfVisit <= 0) continue;

    // Each additional guest is treated as one extra person beyond the residents
    const visitorCost = Math.round(
      (expense.valor * (daysOfVisit / daysInMonth)) / (numberOfResidents + 1)
    );

    if (visitorCost > 0) {
      results.push({ visitorCost, hostId: guest.hostId, guestId: guest.id });
    }
  }

  return results;
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

  const visitors = computeVisitorCostsForExpense(expense, monthKey, guests);
  if (visitors.length === 0) {
    return Object.fromEntries(
      Object.entries(expense.split).map(([userId, percent]) => [
        userId,
        Math.round((expense.valor * percent) / 100),
      ])
    );
  }

  // Deduct the total visitor cost from the shared pool
  const totalVisitorCost = visitors.reduce((sum, v) => sum + v.visitorCost, 0);
  const remainder = expense.valor - totalVisitorCost;
  const owed: Record<string, number> = {};
  let remainderAllocated = 0;

  for (const [userId, percent] of Object.entries(expense.split)) {
    const portion = Math.round((remainder * percent) / 100);
    owed[userId] = (owed[userId] ?? 0) + portion;
    remainderAllocated += portion;
  }

  // Distribute rounding diff to the first host
  const roundingDiff = remainder - remainderAllocated;
  if (visitors[0]) {
    owed[visitors[0].hostId] = (owed[visitors[0].hostId] ?? 0) + roundingDiff;
  }

  // Add each visitor's repasse to their respective host
  for (const v of visitors) {
    owed[v.hostId] = (owed[v.hostId] ?? 0) + v.visitorCost;
  }

  return owed;
}

