import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CatalogPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Katalog Koi',
  description: 'Nishikigoi yang dijual langsung, dengan harga tetap.'
};

export default async function CatalogsRoute({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;

  return (
    <Suspense>
      <CatalogPage params={params} {...(q ? { q } : {})} />
    </Suspense>
  );
}
