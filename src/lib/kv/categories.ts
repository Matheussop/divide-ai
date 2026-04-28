import { kv } from "@vercel/kv";
import type { Category } from "@/types";

export async function getCategories(): Promise<Category[]> {
  return (await kv.get<Category[]>("categories")) ?? [];
}

export async function setCategories(categories: Category[]): Promise<void> {
  await kv.set("categories", categories);
}

export async function addCategory(category: Category): Promise<void> {
  const categories = await getCategories();
  categories.push(category);
  await setCategories(categories);
}

export async function updateCategory(
  id: string,
  data: Partial<Category>
): Promise<Category | null> {
  const categories = await getCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return null;

  categories[index] = { ...categories[index], ...data };
  await setCategories(categories);
  return categories[index];
}

export async function deleteCategory(id: string): Promise<boolean> {
  const categories = await getCategories();
  const filtered = categories.filter((c) => c.id !== id);
  if (filtered.length === categories.length) return false;

  await setCategories(filtered);
  return true;
}
