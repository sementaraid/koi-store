import { listCategories } from '@/lib/data/categories';
import { getShell } from '@/lib/shell';

import { Categories } from './components/Categories';

export async function CategoriesPage() {
  const [{ account, cart }, { categories }] = await Promise.all([
    getShell(),
    listCategories()
  ]);

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
      account={account}
      cart={cart}
    />
  );
}
