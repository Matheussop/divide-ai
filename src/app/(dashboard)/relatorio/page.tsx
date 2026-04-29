import { MonthlyReportPage } from "@/components/dashboard/monthly-report-page";
import { getCategories } from "@/lib/kv/categories";
import { getResidents } from "@/lib/kv/users";
import { getExpenses } from "@/lib/kv/expenses";
import { getGuests } from "@/lib/kv/guests";
import { formatMonthLabel, resolveMonthKey } from "@/lib/month";
import { prevMonthKey } from "@/lib/finance/balances";

type ReportPageProps = {
  searchParams?: {
    mes?: string;
  };
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const monthKey = resolveMonthKey(searchParams?.mes);
  const previousMonth = prevMonthKey(monthKey);
  
  const [expenses, categories, users, guestsThisMonth, guestsPrevMonth] = await Promise.all([
    getExpenses(monthKey),
    getCategories(),
    getResidents(),
    getGuests(monthKey),
    getGuests(previousMonth),
  ]);

  const guests = [...guestsThisMonth, ...guestsPrevMonth];

  return (
    <MonthlyReportPage
      monthKey={monthKey}
      monthLabel={formatMonthLabel(monthKey)}
      expenses={expenses}
      categories={categories}
      users={users}
      guests={guests}
    />
  );
}

