import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Cart } from '@/components/sections';

export const metadata: Metadata = {
  title: 'Keranjang',
  description: 'Lot yang Anda menangkan dan barang yang Anda beli.',
  robots: { index: false, follow: false }
};

export default function CartRoute() {
  return (
    <Suspense>
      <Cart />
    </Suspense>
  );
}
