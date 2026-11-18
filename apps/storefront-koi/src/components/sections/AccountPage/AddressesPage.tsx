import { ROUTES } from '@/const/routes';
import { requireCustomer } from '@/lib/guard';
import { getShell } from '@/lib/shell';

import { Addresses } from './components/Addresses';
import { countOpen } from './components/Orders';
import { listOrderGroups } from './AccountPage';

export async function AddressesPage() {
  const [customer, { account, cart }] = await Promise.all([
    requireCustomer(ROUTES.addresses),
    getShell()
  ]);
  const groups = await listOrderGroups();

  return (
    <Addresses
      addresses={customer.addresses ?? []}
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    />
  );
}
