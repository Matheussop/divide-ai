"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { clearLogs, deleteLog } from "@/lib/kv/logs";
import type { ActionResult } from "@/types";

function revalidateLogViews() {
  revalidatePath("/historico", "page");
}

export async function deleteLogAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Acesso negado." };
  }

  const deleted = await deleteLog(id);
  if (!deleted) {
    return { success: false, error: "Registro não encontrado." };
  }

  revalidateLogViews();
  return { success: true };
}

export async function clearLogsAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Acesso negado." };
  }

  await clearLogs();
  revalidateLogViews();

  return { success: true };
}
