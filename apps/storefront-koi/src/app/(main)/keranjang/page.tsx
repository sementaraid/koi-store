import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Cart } from '@/components/sections';
import { CheckoutSkeleton } from '@/components/sections/LoadingPages/LoadingPages';

export const metadata: Metadata = {
  title: 'Keranjang',
  description: 'Lot yang Anda menangkan dan barang yang Anda beli.',
  robots: { index: false, follow: false }
};

export default function CartRoute() {
  return (
    <Suspense fallback={<CheckoutSkeleton label="Memuat keranjang…" trail />}>
      <Cart />
    </Suspense>
  );
}
