import { getJSON, setJSON } from "@/lib/redis";
import type { RecurringTemplate } from "@/types";

export async function getRecurring(): Promise<RecurringTemplate[]> {
  return (await getJSON<RecurringTemplate[]>("recurring")) ?? [];
}

export async function setRecurring(
  templates: RecurringTemplate[]
): Promise<void> {
  await setJSON("recurring", templates);
}

export async function addRecurring(
  template: RecurringTemplate
): Promise<void> {
  const templates = await getRecurring();
  templates.push(template);
  await setRecurring(templates);
}

export async function updateRecurring(
  id: string,
  data: Partial<RecurringTemplate>
): Promise<RecurringTemplate | null> {
  const templates = await getRecurring();
  const index = templates.findIndex((t) => t.id === id);
  if (index === -1) return null;

  templates[index] = { ...templates[index], ...data };
  await setRecurring(templates);
  return templates[index];
}

export async function deleteRecurring(id: string): Promise<boolean> {
  const templates = await getRecurring();
  const filtered = templates.filter((t) => t.id !== id);
  if (filtered.length === templates.length) return false;

  await setRecurring(filtered);
  return true;
}
