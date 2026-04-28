import { MonthlyReportPage } from "@/components/dashboard/monthly-report-page";
import { getCategories } from "@/lib/kv/categories";
import { getDefaultUsers } from "@/lib/kv/users";
import { getExpenses } from "@/lib/kv/expenses";
import { formatMonthLabel, resolveMonthKey } from "@/lib/month";

type ReportPageProps = {
  searchParams?: {
    mes?: string;
  };
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const monthKey = resolveMonthKey(searchParams?.mes);
  const [expenses, categories, users] = await Promise.all([
    getExpenses(monthKey),
    getCategories(),
    getDefaultUsers(),
  ]);

  return (
    <MonthlyReportPage
      monthKey={monthKey}
      monthLabel={formatMonthLabel(monthKey)}
      expenses={expenses}
      categories={categories}
      users={users}
    />
  );
}

