"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/kv/categories";
import { categorySchema } from "@/lib/schemas";
import type { ActionResult, Category } from "@/types";

interface CategoryActionInput {
  nome: string;
  icone: string;
}

function revalidateCategoryViews() {
  revalidatePath("/");
  revalidatePath("/categorias");
  revalidatePath("/despesas");
}

function parseCategoryInput(input: CategoryActionInput) {
  return categorySchema.safeParse({
    nome: input.nome.trim(),
    icone: input.icone,
  });
}

export async function createCategoryAction(
  input: CategoryActionInput
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const parsed = parseCategoryInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const categories = await getCategories();
  const duplicate = categories.some(
    (category) => category.nome.trim().toLowerCase() === parsed.data.nome.toLowerCase()
  );
  if (duplicate) {
    return { success: false, error: "Já existe uma categoria com esse nome." };
  }

  const category: Category = {
    id: `cat-${crypto.randomUUID().slice(0, 8)}`,
    nome: parsed.data.nome,
    icone: parsed.data.icone,
  };

  await addCategory(category);
  revalidateCategoryViews();
  return { success: true, data: category };
}

export async function updateCategoryAction(
  categoryId: string,
  input: CategoryActionInput
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const parsed = parseCategoryInput(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const categories = await getCategories();
  const duplicate = categories.some(
    (category) =>
      category.id !== categoryId &&
      category.nome.trim().toLowerCase() === parsed.data.nome.toLowerCase()
  );
  if (duplicate) {
    return { success: false, error: "Já existe uma categoria com esse nome." };
  }

  const updated = await updateCategory(categoryId, {
    nome: parsed.data.nome,
    icone: parsed.data.icone,
  });

  if (!updated) {
    return { success: false, error: "Categoria não encontrada." };
  }

  revalidateCategoryViews();
  return { success: true, data: updated };
}

export async function deleteCategoryAction(
  categoryId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const deleted = await deleteCategory(categoryId);
  if (!deleted) {
    return { success: false, error: "Categoria não encontrada." };
  }

  revalidateCategoryViews();
  return { success: true };
}
