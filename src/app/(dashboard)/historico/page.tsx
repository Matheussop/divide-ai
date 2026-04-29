import { HistoryPage } from "@/components/dashboard/history-page";
import { getMonthsWithData, getBalance } from "@/lib/kv/balances";
import { getExpenses } from "@/lib/kv/expenses";
import { getResidents } from "@/lib/kv/users";
import { formatMonthLabel } from "@/lib/month";

export default async function HistoricoRoute() {
  const months = await getMonthsWithData();
  const users = await getResidents();
  
  // Fetch summary data for all months
  const monthsData = await Promise.all(
    months.map(async (month) => {
      const expenses = await getExpenses(month);
      const totalSpent = expenses.reduce((sum, exp) => sum + exp.valor, 0);
      const balance = await getBalance(month);
      
      return {
        monthKey: month,
        label: formatMonthLabel(month),
        totalSpent,
        expensesCount: expenses.length,
        balance,
      };
    })
  );

  return <HistoryPage data={monthsData} users={users} />;
}
