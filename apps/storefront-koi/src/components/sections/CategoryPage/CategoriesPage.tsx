import { listCategories } from '@/lib/data/categories';

import { Categories } from './components/Categories';

export async function CategoriesPage() {
  const { categories } = await listCategories();

  return (
    <Categories
      groups={categories.map((group) => ({
        id: group.id,
        name: group.name,
        handle: group.handle,
        description: group.description ?? null,
        children: (group.category_children ?? []).map((child) => ({
          id: child.id,
          name: child.name,
          handle: child.handle
        }))
      }))}
    />
  );
}
