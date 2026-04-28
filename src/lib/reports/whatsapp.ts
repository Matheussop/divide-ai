import type { Category, Expense, User } from "@/types";

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function buildWhatsAppExportText(args: {
  monthLabel: string;
  expenses: Expense[];
  categories: Category[];
  users: User[];
}) {
  const categoryMap = new Map(args.categories.map((category) => [category.id, category.nome]));
  const userMap = new Map(args.users.map((user) => [user.id, user.nome]));

  const lines: string[] = [];
  lines.push(`DivideAí — ${args.monthLabel}`);
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

  for (const expense of sorted) {
    const date = expense.data ?? expense.criadoEm.slice(0, 10);
    const category = categoryMap.get(expense.categoriaId) ?? "Sem categoria";
    const payer = userMap.get(expense.pagadorId) ?? expense.pagadorId;
    lines.push(`- ${date} · ${category} · ${formatCurrency(expense.valor)} · pagou ${payer} · ${expense.descricao}`);
  }

  lines.push("");
  const total = args.expenses.reduce((sum, expense) => sum + expense.valor, 0);
  lines.push(`Total: ${formatCurrency(total)}`);

  return lines.join("\n");
}

export function buildWhatsAppUrl(text: string) {
  const encoded = encodeURIComponent(text);
  return `https://wa.me/?text=${encoded}`;
}

