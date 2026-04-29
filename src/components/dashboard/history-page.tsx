"use client";

import { CalendarRange, Activity, PlusCircle, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityLog } from "@/types";

interface HistoryPageProps {
  logs: ActivityLog[];
}

function getIconForAction(actionType: string) {
  switch (actionType) {
    case "CREATE":
      return <PlusCircle className="size-4" />;
    case "UPDATE":
      return <Pencil className="size-4" />;
    case "DELETE":
      return <Trash2 className="size-4" />;
    default:
      return <Activity className="size-4" />;
  }
}

function getColorForAction(actionType: string) {
  switch (actionType) {
    case "CREATE":
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "UPDATE":
      return "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "DELETE":
      return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
    default:
      return "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "agora mesmo";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `há ${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `há ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `há ${diffInDays}d`;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function HistoryPage({ logs }: HistoryPageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.15),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.8))] p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.15),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))]">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700 dark:text-indigo-300">
          <CalendarRange className="size-3.5" />
          Auditoria
        </div>
        <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">
          Histórico de ações
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Acompanhe em tempo real quem adicionou, editou ou apagou registros no sistema.
        </p>
      </section>

      <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
        <CardHeader>
          <CardTitle className="text-lg tracking-[-0.03em]">Últimas atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-2 bottom-2 w-px bg-border/60 hidden sm:block" />

            {logs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-background/70 px-4 py-8 text-center text-sm leading-6 text-muted-foreground">
                Nenhum histórico encontrado ainda.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-start sm:border-transparent sm:bg-transparent sm:p-0 relative z-10"
                >
                  {/* Icon / Avatar */}
                  <div className="hidden sm:flex items-center justify-center size-12 rounded-full border border-border bg-card shrink-0 shadow-sm z-10">
                    <div className={cn("size-8 rounded-full border flex items-center justify-center", getColorForAction(log.actionType))}>
                      {getIconForAction(log.actionType)}
                    </div>
                  </div>

                  {/* Content Box */}
                  <div className="flex-1 sm:rounded-3xl sm:border sm:border-border/60 sm:bg-background/70 sm:p-4">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {log.userName}
                      </p>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", getColorForAction(log.actionType))}>
                        {log.entityName}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {log.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
