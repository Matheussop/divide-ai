import { CategoriesManager } from "@/components/dashboard/categories-manager";
import { getCategories } from "@/lib/kv/categories";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return <CategoriesManager categories={categories} />;
}
