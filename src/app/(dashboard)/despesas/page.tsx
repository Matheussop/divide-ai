import { ExpensesManager } from "@/components/dashboard/expenses-manager";
import { getCategories } from "@/lib/kv/categories";
import { getExpenses } from "@/lib/kv/expenses";
import { getDefaultUsers } from "@/lib/kv/users";

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export default async function ExpensesPage() {
  const monthKey = getMonthKey();
  const [categories, users, expenses] = await Promise.all([
    getCategories(),
    getDefaultUsers(),
    getExpenses(monthKey),
  ]);

  return (
    <ExpensesManager
      monthLabel={formatMonthLabel(monthKey)}
      categories={categories}
      users={users}
      expenses={expenses}
    />
  );
}
