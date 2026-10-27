'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { ROUTES } from '@/const/routes';
import { CartPage } from '@/components/sections/Cart/components/CartPage';
import type { CartLine, CartMoney } from '@/types/cart';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { Product } from '@/types/product';
import { deleteLineItem, updateLineItem } from '@/lib/data/cart';

/**
 * The cart, with its two mutations wired to the cart's own server actions.
 *
 * The kit's handlers report a `Product`; Medusa's mutations take a line id, so
 * the pairing is handed down as a map (see `lib/adapters/cart.ts`). Both actions
 * revalidate the cart tag themselves, so there is nothing to hold here — the
 * server re-renders this page with the new lines.
 */
export function CartLines({
  lines,
  lineIds,
  money,
  account,
  cart
}: {
  lines: CartLine[];
  lineIds: Record<string, string>;
  money?: CartMoney;
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  /* One guard for both: a second click mid-flight would fire against a quantity
     the server has already moved past. */
  const run = (job: () => Promise<unknown>) => {
    if (pending) return;

    start(async () => {
      try {
        await job();
      } catch {
        toast.error('Gagal memperbarui keranjang. Coba lagi.');
      }
    });
  };

  return (
    <CartPage
      lines={lines}
      {...(money ? { money } : {})}
      account={account}
      cart={cart}
      onQuantityChange={(product, quantity) => {
        const lineId = lineIds[product.id];
        if (!lineId || quantity < 1) return;
        run(() => updateLineItem({ lineId, quantity }));
      }}
      onRemove={(product: Product) => {
        const lineId = lineIds[product.id];
        if (!lineId) return;
        run(() => deleteLineItem(lineId));
      }}
      onCheckout={() => router.push(ROUTES.shipping)}
    />
  );
}
