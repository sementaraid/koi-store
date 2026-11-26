import { ROUTES } from '@/const/routes';
import { requireCustomer } from '@/lib/guard';
import { getAccountIdentity } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Settings } from './components/Settings';

export async function SettingsPage() {
  const [customer, identity] = await Promise.all([
    requireCustomer(ROUTES.settings),
    getAccountIdentity()
  ]);
  const groups = await listOrderGroups();

  return (
    <Settings
      customer={customer}
      openOrders={countOpen(groups)}
      identity={identity}
    />
  );
}
