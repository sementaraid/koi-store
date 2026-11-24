import { toCartLines, toCartMoney, toLineIds } from '@/lib/adapters/cart';
import { retrieveCart } from '@/lib/data/cart';

import { CartLines } from './components/CartLines';

export async function Cart() {
  const cart = await retrieveCart();

  const money = toCartMoney(cart);

  return (
    <CartLines
      lines={toCartLines(cart)}
      lineIds={toLineIds(cart)}
      {...(money ? { money } : {})}
    />
  );
}
