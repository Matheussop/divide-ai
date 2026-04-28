"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addGuest,
  deleteGuest,
  getGuests,
  updateGuest,
} from "@/lib/kv/guests";
import { guestSchema } from "@/lib/schemas";
import type { ActionResult, Guest } from "@/types";

interface GuestActionInput {
  nome: string;
  hostId: string;
  dataInicio: string;
  dataFim: string;
}

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function revalidateGuestViews() {
  revalidatePath("/");
  revalidatePath("/visitas");
}

function parseGuestInput(input: GuestActionInput) {
  return guestSchema.safeParse({
    nome: input.nome.trim(),
    hostId: input.hostId,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
  });
}

function validateGuestPeriod(dataInicio: string, dataFim: string): string | null {
  const start = new Date(`${dataInicio}T00:00:00`);
  const end = new Date(`${dataFim}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Datas invalidas.";
  }

  if (end < start) {
    return "A data final nao pode ser anterior a data inicial.";
  }

  return null;
}

export async function createGuestAction(
  input: GuestActionInput
): Promise<ActionResult<Guest>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Nao autorizado" };
  }

  const parsed = parseGuestInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const periodError = validateGuestPeriod(parsed.data.dataInicio, parsed.data.dataFim);
  if (periodError) {
    return { success: false, error: periodError };
  }

  const guest: Guest = {
    id: `guest-${crypto.randomUUID().slice(0, 10)}`,
    nome: parsed.data.nome,
    hostId: parsed.data.hostId,
    dataInicio: parsed.data.dataInicio,
    dataFim: parsed.data.dataFim,
  };

  await addGuest(getMonthKey(), guest);
  revalidateGuestViews();
  return { success: true, data: guest };
}

export async function updateGuestAction(
  guestId: string,
  input: GuestActionInput
): Promise<ActionResult<Guest>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Nao autorizado" };
  }

  const parsed = parseGuestInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const periodError = validateGuestPeriod(parsed.data.dataInicio, parsed.data.dataFim);
  if (periodError) {
    return { success: false, error: periodError };
  }

  const updated = await updateGuest(getMonthKey(), guestId, {
    nome: parsed.data.nome,
    hostId: parsed.data.hostId,
    dataInicio: parsed.data.dataInicio,
    dataFim: parsed.data.dataFim,
  });

  if (!updated) {
    return { success: false, error: "Visita nao encontrada." };
  }

  revalidateGuestViews();
  return { success: true, data: updated };
}

export async function deleteGuestAction(
  guestId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Nao autorizado" };
  }

  const deleted = await deleteGuest(getMonthKey(), guestId);
  if (!deleted) {
    return { success: false, error: "Visita nao encontrada." };
  }

  revalidateGuestViews();
  return { success: true };
}
