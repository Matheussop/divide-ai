import { HistoryPage } from "@/components/dashboard/history-page";
import { auth } from "@/lib/auth";
import { getLogs } from "@/lib/kv/logs";

export const dynamic = "force-dynamic";

export default async function HistoricoRoute() {
  const [session, logs] = await Promise.all([auth(), getLogs()]);

  return <HistoryPage logs={logs} userRole={session?.user?.role} />;
}
