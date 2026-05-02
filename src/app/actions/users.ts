"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { getUserById, setUser, deleteUser as deleteUserKv } from "@/lib/kv/users";
import { getJSON, setJSON } from "@/lib/redis";
import type { ActionResult, User } from "@/types";

function revalidateUserViews() {
  revalidatePath("/usuarios", "page");
  revalidatePath("/", "layout");
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

  const oldEmail = existingUser.email;

  // Update fields
  existingUser.nome = input.nome;
  existingUser.email = input.email;
  existingUser.role = input.role;

  if (input.password && input.password.trim().length > 0) {
    existingUser.passwordHash = await hash(input.password, 12);
  }

  await setUser(existingUser);

  // Update email index if email changed
  if (oldEmail !== input.email) {
    const emailIndex = (await getJSON<Record<string, string>>("user-emails")) ?? {};
    delete emailIndex[oldEmail];
    emailIndex[input.email] = existingUser.id;
    await setJSON("user-emails", emailIndex);
  }

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

  // Check if email already exists
  const emailIndex = (await getJSON<Record<string, string>>("user-emails")) ?? {};
  if (emailIndex[input.email]) {
    return { success: false, error: "Este email já está em uso." };
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
  
  emailIndex[input.email] = newUser.id;
  await setJSON("user-emails", emailIndex);

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

  const existingUser = await getUserById(id);
  if (existingUser) {
    const emailIndex = (await getJSON<Record<string, string>>("user-emails")) ?? {};
    delete emailIndex[existingUser.email];
    await setJSON("user-emails", emailIndex);
  }

  await deleteUserKv(id);
  revalidateUserViews();

  return { success: true };
}
