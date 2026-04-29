import { HistoryPage } from "@/components/dashboard/history-page";
import { getLogs } from "@/lib/kv/logs";

export const dynamic = "force-dynamic";

export default async function HistoricoRoute() {
  const logs = await getLogs();

  return <HistoryPage logs={logs} />;
}
