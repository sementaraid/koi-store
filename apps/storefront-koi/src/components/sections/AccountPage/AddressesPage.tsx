import { ROUTES } from '@/const/routes';
import { requireCustomer } from '@/lib/guard';
import { getAccountIdentity } from '@/lib/shell';

import { Addresses } from './components/Addresses';
import { countOpen } from './components/Orders';
import { listOrderGroups } from './AccountPage';

export async function AddressesPage() {
  const [customer, identity] = await Promise.all([
    requireCustomer(ROUTES.addresses),
    getAccountIdentity()
  ]);
  const groups = await listOrderGroups();

  return (
    <Addresses
      addresses={customer.addresses ?? []}
      openOrders={countOpen(groups)}
      identity={identity}
    />
  );
}
