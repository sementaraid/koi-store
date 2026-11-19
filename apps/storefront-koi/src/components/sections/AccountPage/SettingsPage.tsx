import { ROUTES } from '@/const/routes';
import { requireCustomer } from '@/lib/guard';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Settings } from './components/Settings';

export async function SettingsPage() {
  const [customer, { account, cart }] = await Promise.all([
    requireCustomer(ROUTES.settings),
    getShell()
  ]);
  const groups = await listOrderGroups();

  return (
    <Settings
      customer={customer}
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    />
  );
}
