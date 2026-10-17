import type { Metadata } from 'next';
import { Suspense } from 'react';

import { toCartLines, toLineIds } from '@/lib/adapters/cart';
import { retrieveCart } from '@/lib/data/cart';
import { getShell } from '@/lib/shell';

import { CartLines } from './lines';

export const metadata: Metadata = {
  title: 'Keranjang',
  description: 'Lot yang Anda menangkan dan barang yang Anda beli.',
  /* A visitor's own cart is nobody else's page. */
  robots: { index: false, follow: false }
};

export default async function CartRoute() {
  const [{ account, cart: bar }, cart] = await Promise.all([
    getShell(),
    retrieveCart()
  ]);

  return (
    <Suspense>
      <CartLines
        lines={toCartLines(cart)}
        lineIds={toLineIds(cart)}
        account={account}
        cart={bar}
      />
    </Suspense>
  );
}
