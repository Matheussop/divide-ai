import { ExpensesManager } from "@/components/dashboard/expenses-manager";
import { getCategories } from "@/lib/kv/categories";
import { getExpenses } from "@/lib/kv/expenses";
import { getGuests } from "@/lib/kv/guests";
import { getResidents } from "@/lib/kv/users";
import { formatMonthLabel, resolveMonthKey } from "@/lib/month";
import { prevMonthKey } from "@/lib/finance/balances";

type ExpensesPageProps = {
  searchParams?: {
    mes?: string;
  };
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const monthKey = resolveMonthKey(searchParams?.mes);
  const previousMonth = prevMonthKey(monthKey);
  const [categories, users, expenses, guestsThisMonth, guestsPrevMonth] = await Promise.all([
    getCategories(),
    getResidents(),
    getExpenses(monthKey),
    getGuests(monthKey),
    getGuests(previousMonth),
  ]);

  const guests = [...guestsThisMonth, ...guestsPrevMonth];

  return (
    <ExpensesManager
      monthKey={monthKey}
      monthLabel={formatMonthLabel(monthKey)}
      categories={categories}
      users={users}
      expenses={expenses}
      guests={guests}
    />
  );
}
