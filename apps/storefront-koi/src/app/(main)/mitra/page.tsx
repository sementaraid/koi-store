import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PartnersPage } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Mitra Breeder',
  description:
    'Sentra budidaya yang lolos inspeksi parameter air, biosecurity karantina, dan akurasi silsilah indukan.'
};

export default function PartnersRoute() {
  return (
    <Suspense>
      <PartnersPage />
    </Suspense>
  );
}
