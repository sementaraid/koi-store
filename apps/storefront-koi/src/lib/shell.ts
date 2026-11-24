import type { HeaderAccount, HeaderCart } from '@/types/header';
import { retrieveCart } from '@/lib/data/cart';
import { getSession } from '@/lib/data/session';
import { getWallet } from '@/lib/data/wallet';

export async function getShell(): Promise<{
  account?: HeaderAccount;
  cart?: HeaderCart;
}> {
  const [session, cart] = await Promise.all([
    getSession().catch(() => ({ status: 'error' as const })),
    retrieveCart().catch(() => null)
  ]);

  const customer = session.status === 'authenticated' ? session.customer : null;

  // The balance chip is part of the identity, so it is read once with the rest of
  // the shell. A wallet read that fails only omits the chip; it never breaks a page.
  const balance = customer
    ? await getWallet(1, 0)
        .then((wallet) => wallet.balance)
        .catch(() => undefined)
    : undefined;

  const account: HeaderAccount | undefined = customer
    ? {
        user: {
          name:
            [customer.first_name, customer.last_name]
              .filter(Boolean)
              .join(' ') || customer.email,
          role: (customer.metadata?.tier as string | undefined) ?? undefined
        },
        balance
      }
    : undefined;

  const count = cart?.items?.reduce((n, item) => n + item.quantity, 0) ?? 0;

  return { account, cart: cart ? { count } : undefined };
}

/**
 * The signed-in name an account page shows in its own sidebar. The header reads
 * the full shell in the layout; a page reads only what its content needs.
 */
export async function getAccountIdentity(): Promise<
  { name: string; email: string } | undefined
> {
  const session = await getSession().catch(() => null);
  if (session?.status !== 'authenticated') return undefined;

  const { customer } = session;

  return {
    name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email,
    email: ''
  };
}
