import type { HeaderAccount } from '@/types/header';
import { getMyFarm } from '@/lib/data/farm';
import { getSession } from '@/lib/data/session';
import { getWallet } from '@/lib/data/wallet';
import { accountIdentity, type AccountIdentity } from '@/lib/helpers/account-identity';

export async function getShell(): Promise<{
  account?: HeaderAccount;
}> {
  const session = await getSession().catch(() => ({ status: 'error' as const }));

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

  return { account };
}

/**
 * The signed-in name, city and farm flag an account page shows in its own
 * sidebar (US-103 AC10). The header reads the full shell in the layout; a page
 * reads only what its content needs.
 */
export async function getAccountIdentity(): Promise<AccountIdentity | undefined> {
  const session = await getSession().catch(() => null);
  if (session?.status !== 'authenticated') return undefined;

  // No member session or no seller is not an outage: it just means this buyer
  // has not registered a farm, so the menu keeps pointing at the registration.
  const isFarmer = await getMyFarm()
    .then((seller) => Boolean(seller))
    .catch(() => false);

  return accountIdentity(session.customer, isFarmer);
}
