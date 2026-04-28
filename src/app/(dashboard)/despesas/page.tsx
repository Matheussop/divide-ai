import { ExpensesManager } from "@/components/dashboard/expenses-manager";
import { getCategories } from "@/lib/kv/categories";
import { getExpenses } from "@/lib/kv/expenses";
import { getDefaultUsers } from "@/lib/kv/users";
import { formatMonthLabel, resolveMonthKey } from "@/lib/month";

type ExpensesPageProps = {
  searchParams?: {
    mes?: string;
  };
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const monthKey = resolveMonthKey(searchParams?.mes);
  const [categories, users, expenses] = await Promise.all([
    getCategories(),
    getDefaultUsers(),
    getExpenses(monthKey),
  ]);

  return (
    <ExpensesManager
      monthKey={monthKey}
      monthLabel={formatMonthLabel(monthKey)}
      categories={categories}
      users={users}
      expenses={expenses}
    />
  );
}
