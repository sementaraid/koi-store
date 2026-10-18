import { toCartLines, toLineIds } from '@/lib/adapters/cart';
import { retrieveCart } from '@/lib/data/cart';
import { getShell } from '@/lib/shell';

import { CartLines } from './components/CartLines';

export async function Cart() {
  const [{ account, cart: bar }, cart] = await Promise.all([
    getShell(),
    retrieveCart()
  ]);

  return (
    <CartLines
      lines={toCartLines(cart)}
      lineIds={toLineIds(cart)}
      account={account}
      cart={bar}
    />
  );
}
