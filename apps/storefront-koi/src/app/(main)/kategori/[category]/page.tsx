import type { Metadata } from 'next';

import { CategoryPage, getCategory } from '@/components/sections';

export async function generateMetadata({
  params
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const found = await getCategory(category);

  if (!found) return { title: 'Kategori tidak ditemukan' };

  return {
    title: `Koi ${found.name}`,
    description: found.description ?? undefined
  };
}

/* No `Suspense`, same reasoning as `mitra/[handle]`: an unknown handle is a
   `notFound()` inside the section, and a boundary above it would flush the
   shell before the 404 could be set. */
export default async function CategoryRoute({
  params
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  return <CategoryPage handle={category} />;
}
