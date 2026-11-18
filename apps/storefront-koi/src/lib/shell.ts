import type { HeaderAccount, HeaderCart } from '@/types/header';
import { retrieveCart } from '@/lib/data/cart';
import { retrieveCustomer } from '@/lib/data/customer';

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

  const count = cart?.items?.reduce((n, item) => n + item.quantity, 0) ?? 0;

  return { account, cart: cart ? { count } : undefined };
}
