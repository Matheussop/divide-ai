import { getJSON, setJSON } from "@/lib/redis";
import type { ActivityLog } from "@/types";

const LOGS_KEY = "activity-logs";
const MAX_LOGS = 300; // Manter apenas os últimos 300 registros para não estourar o KV

export async function getLogs(): Promise<ActivityLog[]> {
  return (await getJSON<ActivityLog[]>(LOGS_KEY)) ?? [];
}

export async function addLog(log: Omit<ActivityLog, "id" | "createdAt">): Promise<void> {
  const logs = await getLogs();
  
  const newLog: ActivityLog = {
    ...log,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  // Add to the beginning of the array
  logs.unshift(newLog);

  // Keep only the last MAX_LOGS
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }

  await setJSON(LOGS_KEY, logs);
}

export async function deleteLog(id: string): Promise<boolean> {
  const logs = await getLogs();
  const filtered = logs.filter((log) => log.id !== id);
  if (filtered.length === logs.length) return false;

  await setJSON(LOGS_KEY, filtered);
  return true;
}

export async function clearLogs(): Promise<void> {
  await setJSON(LOGS_KEY, [] as ActivityLog[]);
}
