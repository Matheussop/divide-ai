"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import {
  createGuestAction,
  deleteGuestAction,
  updateGuestAction,
} from "@/app/actions/guests";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Guest, User } from "@/types";
import { useRouter } from "next/navigation";

interface GuestsManagerProps {
  monthKey: string;
  monthLabel: string;
  guests: Guest[];
  users: User[];
}

interface GuestFormState {
  nome: string;
  hostId: string;
  dataInicio: string;
  dataFim: string;
}

const emptyState = (users: User[]): GuestFormState => ({
  nome: "",
  hostId: users[0]?.id ?? "",
  dataInicio: "",
  dataFim: "",
});

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function GuestsManager({ monthKey, monthLabel, guests, users }: GuestsManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => emptyState(users));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userMap = new Map(users.map((user) => [user.id, user.nome]));
  const sortedGuests = useMemo(
    () => [...guests].sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)),
    [guests]
  );

  function resetForm() {
    setForm(emptyState(users));
    setEditingId(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFeedback("");

    void (async () => {
      try {
        const result = editingId
          ? await updateGuestAction(editingId, form, monthKey)
          : await createGuestAction(form, monthKey);

        if (!result.success) {
          setFeedback(result.error ?? "Nao foi possivel salvar a visita.");
          setSubmitting(false);
          return;
        }

        setFeedback(editingId ? "Visita atualizada." : "Visita criada.");
        resetForm();
        setSubmitting(false);
        router.refresh();
      } catch {
        setFeedback("Erro inesperado. Tente novamente.");
        setSubmitting(false);
      }
    })();
  }

  function handleEdit(guest: Guest) {
    setEditingId(guest.id);
    setFeedback("");
    setForm({
      nome: guest.nome,
      hostId: guest.hostId,
      dataInicio: guest.dataInicio,
      dataFim: guest.dataFim,
    });
  }

  function handleDelete(guestId: string, guestName: string) {
    const confirmed = window.confirm(`Excluir a visita de ${guestName}?`);
    if (!confirmed) return;

    setSubmitting(true);
    setFeedback("");

    void (async () => {
      try {
        const result = await deleteGuestAction(guestId, monthKey);
        if (!result.success) {
          setFeedback(result.error ?? "Nao foi possivel excluir a visita.");
          setSubmitting(false);
          return;
        }

        if (editingId === guestId) {
          resetForm();
        }

        setFeedback("Visita excluida.");
        setSubmitting(false);
        router.refresh();
      } catch {
        setFeedback("Erro inesperado ao excluir. Tente novamente.");
        setSubmitting(false);
      }
    })();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.8))] p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">
              <CalendarDays className="size-3.5" />
              {monthLabel}
            </div>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">
              Controle as visitas para destravar a divisao proporcional.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Registre periodo e anfitriao no mes selecionado para preparar os calculos das proximas fases.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <MonthSelector monthKey={monthKey} />
            <div className="rounded-3xl border border-border/60 bg-background/75 px-4 py-3 text-right backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                visitas no mes
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {guests.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg tracking-[-0.03em]">
              <Plus className="size-4 text-sky-600 dark:text-sky-400" />
              {editingId ? "Editar visita" : "Nova visita"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="guest-name" className="text-sm font-semibold text-foreground">
                  Nome da visita
                </Label>
                <Input
                  id="guest-name"
                  placeholder="Ex.: Ana"
                  value={form.nome}
                  onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-host" className="text-sm font-semibold text-foreground">
                  Morador anfitriao
                </Label>
                <select
                  id="guest-host"
                  value={form.hostId}
                  onChange={(event) => setForm((current) => ({ ...current, hostId: event.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guest-start" className="text-sm font-semibold text-foreground">
                    Data inicio
                  </Label>
                  <Input
                    id="guest-start"
                    type="date"
                    value={form.dataInicio}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, dataInicio: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-end" className="text-sm font-semibold text-foreground">
                    Data fim
                  </Label>
                  <Input
                    id="guest-end"
                    type="date"
                    value={form.dataFim}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, dataFim: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              {feedback ? (
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm font-medium text-foreground">
                  {feedback}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={submitting}>
                  {editingId ? "Salvar alteracoes" : "Criar visita"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    Cancelar edicao
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle className="text-lg tracking-[-0.03em]">Visitas cadastradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedGuests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-background/70 px-4 py-5 text-sm leading-6 text-muted-foreground">
                Nenhuma visita cadastrada neste mes.
              </div>
            ) : (
              sortedGuests.map((guest) => (
                <div key={guest.id} className="rounded-3xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <UsersRound className="size-4 text-sky-500" />
                        {guest.nome}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        anfitriao: {userMap.get(guest.hostId) ?? guest.hostId}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatDate(guest.dataInicio)} ate {formatDate(guest.dataFim)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {daysBetween(guest.dataInicio, guest.dataFim)} dia(s)
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        onClick={() => handleEdit(guest)}
                        disabled={submitting}
                        className={cn(
                          editingId === guest.id &&
                          "border-sky-500/60 text-sky-700 dark:text-sky-300"
                        )}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        onClick={() => handleDelete(guest.id, guest.nome)}
                        disabled={submitting}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
