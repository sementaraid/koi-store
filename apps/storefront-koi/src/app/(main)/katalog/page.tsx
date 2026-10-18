import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CatalogPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Katalog Koi',
  description: 'Nishikigoi yang dijual langsung, dengan harga tetap.'
};

export default function CatalogsRoute() {
  return (
    <Suspense>
      <CatalogPage />
    </Suspense>
  );
}
