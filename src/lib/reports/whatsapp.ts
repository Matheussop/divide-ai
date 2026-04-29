import { computeVisitorCostsForExpense } from "@/lib/finance/visits";
import type { Category, Expense, Guest, User } from "@/types";

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(year, month - 1, day));
}

export function buildWhatsAppExportText(args: {
  monthKey: string;
  monthLabel: string;
  expenses: Expense[];
  categories: Category[];
  users: User[];
  guests: Guest[];
}) {
  const categoryMap = new Map(args.categories.map((category) => [category.id, category.nome]));
  const userMap = new Map(args.users.map((user) => [user.id, user.nome]));
  const guestMap = new Map(args.guests.map((guest) => [guest.id, guest.nome]));

  const lines: string[] = [];
  lines.push(`*DivideAí - ${args.monthLabel}*`);
  lines.push("");

  if (args.expenses.length === 0) {
    lines.push("Nenhuma despesa registrada.");
    return lines.join("\n");
  }

  const sorted = [...args.expenses].sort((a, b) => {
    const ad = a.data ?? a.criadoEm.slice(0, 10);
    const bd = b.data ?? b.criadoEm.slice(0, 10);
    return ad.localeCompare(bd) || a.descricao.localeCompare(b.descricao, "pt-BR");
  });

  const total = args.expenses.reduce((sum, expense) => sum + expense.valor, 0);
  const repassesByHost = new Map<string, number>();

  for (const expense of sorted) {
    const visitors = computeVisitorCostsForExpense(expense, args.monthKey, args.guests);
    for (const visitor of visitors) {
      repassesByHost.set(visitor.hostId, (repassesByHost.get(visitor.hostId) ?? 0) + visitor.visitorCost);
    }
  }

  const totalVisitorCost = Array.from(repassesByHost.values()).reduce((sum, value) => sum + value, 0);

  lines.push("*Resumo*");
  lines.push(`- Total gasto: ${formatCurrency(total)}`);
  lines.push(`- Lançamentos: ${sorted.length}`);
  if (totalVisitorCost > 0) {
    lines.push(`- Total de repasses por visitas: ${formatCurrency(totalVisitorCost)}`);
  }
  lines.push("");
  lines.push("*Lançamentos*");

  for (const expense of sorted) {
    const date = expense.data ?? expense.criadoEm.slice(0, 10);
    const category = categoryMap.get(expense.categoriaId) ?? "Sem categoria";
    const payer = userMap.get(expense.pagadorId) ?? expense.pagadorId;
    const visitors = computeVisitorCostsForExpense(expense, args.monthKey, args.guests);

    lines.push(`- *${expense.descricao}*`);
    lines.push(`  ${formatDate(date)} | ${category} | ${formatCurrency(expense.valor)}`);
    lines.push(`  Pagou: ${payer}`);

    if (visitors.length > 0) {
      lines.push("  Repasses:");
      for (const visitor of visitors) {
        const guestName = guestMap.get(visitor.guestId) ?? "Visita";
        const hostName = userMap.get(visitor.hostId) ?? visitor.hostId;
        lines.push(`  - ${guestName} -> ${hostName}: ${formatCurrency(visitor.visitorCost)}`);
      }
    }

    lines.push("");
  }

  if (repassesByHost.size > 0) {
    lines.push("*Resumo dos repasses*");
    for (const [hostId, value] of Array.from(repassesByHost.entries()).sort((a, b) => b[1] - a[1])) {
      const hostName = userMap.get(hostId) ?? hostId;
      lines.push(`- ${hostName}: ${formatCurrency(value)}`);
    }
    lines.push("");
  }

  lines.push(`*Total do mês: ${formatCurrency(total)}*`);

  return lines.join("\n");
}

export function buildWhatsAppUrl(text: string) {
  const encoded = encodeURIComponent(text);
  return `https://wa.me/?text=${encoded}`;
}
