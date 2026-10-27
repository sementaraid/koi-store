import { toCartLines, toCartMoney, toLineIds } from '@/lib/adapters/cart';
import { retrieveCart } from '@/lib/data/cart';
import { getShell } from '@/lib/shell';

import { CartLines } from './components/CartLines';

export async function Cart() {
  const [{ account, cart: bar }, cart] = await Promise.all([
    getShell(),
    retrieveCart()
  ]);

  /* The cart's own figures where it has them: tax and promotions are the
     backend's arithmetic, and the rail would otherwise print a total that
     disagrees with what gets charged. */
  const money = toCartMoney(cart);

  return (
    <CartLines
      lines={toCartLines(cart)}
      lineIds={toLineIds(cart)}
      {...(money ? { money } : {})}
      account={account}
      cart={bar}
    />
  );
}
