import { listCategories } from '@/lib/data/categories';
import { getShell } from '@/lib/shell';

import { Categories } from './components/Categories';

/**
 * The variety index: every category the catalog is cut into.
 *
 * @remarks
 * Storefront's own `/categories` is not an index at all — it is the whole
 * product listing under an "All Products" heading, which koi already has at
 * `/katalog`. So this page is the half that was missing: the varieties
 * themselves, each one a door into {@link CategoryPage}.
 *
 * `listCategories`'s `parentCategories` are the store's invisible root nodes
 * (Medusa gives every tree one); `categories` is the level beneath them — the
 * actual departments, each with its own children attached. Those are the
 * groups worth showing; the roots are plumbing, and a flat list of every leaf
 * would read as noise next to the catalog's own facet bar.
 */
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
