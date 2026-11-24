import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CategoriesPage } from '@/components/sections';
import { CategoriesSkeleton } from '@/components/sections/LoadingPages/LoadingPages';

export const metadata: Metadata = {
  title: 'Kategori Koi',
  description:
    'Varietas nishikigoi yang tersedia di katalog — Kohaku, Sanke, Showa, dan golongan lainnya.'
};

export default function CategoriesRoute() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesPage />
    </Suspense>
  );
}
