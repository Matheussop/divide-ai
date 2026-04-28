"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { getUserById, setUser, deleteUser as deleteUserKv, getAllUsers } from "@/lib/kv/users";
import type { ActionResult, User } from "@/types";

function revalidateUserViews() {
  revalidatePath("/usuarios");
  revalidatePath("/");
}

interface UpdateUserInput {
  id: string;
  nome: string;
  email: string;
  password?: string; // Optional: if empty, do not change
  role: "admin" | "user";
}

export async function updateUserAction(
  input: UpdateUserInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Acesso negado." };
  }

  const existingUser = await getUserById(input.id);
  if (!existingUser) {
    return { success: false, error: "Usuário não encontrado." };
  }

  // Update fields
  existingUser.nome = input.nome;
  existingUser.email = input.email;
  existingUser.role = input.role;

  if (input.password && input.password.trim().length > 0) {
    existingUser.passwordHash = await hash(input.password, 12);
  }

  await setUser(existingUser);
  revalidateUserViews();

  return { success: true };
}

interface CreateUserInput {
  nome: string;
  email: string;
  password?: string;
  role: "admin" | "user";
}

export async function createUserAction(
  input: CreateUserInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Acesso negado." };
  }

  const passwordHash = await hash(input.password || "123456", 12);

  const newUser: User = {
    id: crypto.randomUUID(),
    nome: input.nome,
    email: input.email,
    passwordHash,
    role: input.role,
  };

  await setUser(newUser);
  revalidateUserViews();

  return { success: true };
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Acesso negado." };
  }

  if (session.user.id === id) {
    return { success: false, error: "Você não pode excluir a si mesmo." };
  }

  await deleteUserKv(id);
  revalidateUserViews();

  return { success: true };
}
