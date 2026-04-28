import { RecurringManager } from "@/components/dashboard/recurring-manager";
import { getRecurring } from "@/lib/kv/recurring";
import { getCategories } from "@/lib/kv/categories";
import { getDefaultUsers } from "@/lib/kv/users";

export default async function RecurringPage() {
  const [templates, categories, users] = await Promise.all([
    getRecurring(),
    getCategories(),
    getDefaultUsers(),
  ]);

  return <RecurringManager templates={templates} categories={categories} users={users} />;
}

