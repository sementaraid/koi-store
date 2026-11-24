'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { ROUTES } from '@/const/routes';
import { CartPage } from '@/components/sections/Cart/components/CartPage';
import type { CartLine, CartMoney } from '@/types/cart';
import type { Product } from '@/types/product';
import { deleteLineItem, updateLineItem } from '@/lib/data/cart';

export function CartLines({
  lines,
  lineIds,
  money
}: {
  lines: CartLine[];
  lineIds: Record<string, string>;
  money?: CartMoney;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

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
