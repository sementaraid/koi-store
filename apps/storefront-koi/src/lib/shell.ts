import type { HeaderAccount, HeaderCart } from '@/types/header';
import { retrieveCart } from '@/lib/data/cart';
import { retrieveCustomer } from '@/lib/data/customer';

/**
 * The two pieces of session state every koi page's `PageShell` carries: who is
 * signed in, and what is in their cart.
 *
 * One function rather than a layout, because `PageShell` is rendered by each
 * page (that is the ported component's contract), and a layout cannot hand
 * props down to it.
 */
export async function getShell(): Promise<{
  account?: HeaderAccount;
  cart?: HeaderCart;
}> {
  const [customer, cart] = await Promise.all([
    retrieveCustomer().catch(() => null),
    retrieveCart().catch(() => null)
  ]);

  const account: HeaderAccount | undefined = customer
    ? {
        user: {
          name:
            [customer.first_name, customer.last_name]
              .filter(Boolean)
              .join(' ') || customer.email,
          role: (customer.metadata?.tier as string | undefined) ?? undefined
        }
      }
    : undefined;

  /* A count only above zero, which is the header's own rule — omit the prop
     and no count is drawn at all. */
  const count = cart?.items?.reduce((n, item) => n + item.quantity, 0) ?? 0;

  return { account, cart: cart ? { count } : undefined };
}
