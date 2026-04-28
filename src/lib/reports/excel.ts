import * as XLSX from "xlsx";
import type { Category, Expense, User } from "@/types";

function formatCurrencyNumber(valueInCents: number) {
  return valueInCents / 100;
}

export function buildMonthlyExcelWorkbook(args: {
  monthKey: string;
  expenses: Expense[];
  categories: Category[];
  users: User[];
}) {
  const categoryMap = new Map(args.categories.map((category) => [category.id, category.nome]));
  const userMap = new Map(args.users.map((user) => [user.id, user.nome]));

  const rows = [...args.expenses]
    .sort((a, b) => (a.data ?? a.criadoEm).localeCompare(b.data ?? b.criadoEm))
    .map((expense) => ({
      Data: expense.data ?? expense.criadoEm.slice(0, 10),
      Descricao: expense.descricao,
      Categoria: categoryMap.get(expense.categoriaId) ?? "Sem categoria",
      Valor: formatCurrencyNumber(expense.valor),
      Pagador: userMap.get(expense.pagadorId) ?? expense.pagadorId,
      Split_user_1: expense.split["user-1"] ?? "",
      Split_user_2: expense.split["user-2"] ?? "",
      Visita: expense.visitaPolitica ?? "",
    }));

  const categoryTotals = args.expenses.reduce<Record<string, number>>((acc, expense) => {
    const categoryName = categoryMap.get(expense.categoriaId) ?? "Sem categoria";
    acc[categoryName] = (acc[categoryName] ?? 0) + expense.valor;
    return acc;
  }, {});

  const summaryRows = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([categoryName, total]) => ({
      Categoria: categoryName,
      Total: formatCurrencyNumber(total),
    }));

  const wb = XLSX.utils.book_new();
  const wsExpenses = XLSX.utils.json_to_sheet(rows);
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

  XLSX.utils.book_append_sheet(wb, wsExpenses, "Despesas");
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

  return wb;
}

export function workbookToBase64(wb: XLSX.WorkBook) {
  const array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const bytes = new Uint8Array(array);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

