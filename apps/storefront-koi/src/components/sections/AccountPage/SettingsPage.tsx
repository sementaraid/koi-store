import { ROUTES } from '@/const/routes';
import { requireCustomer } from '@/lib/guard';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Settings } from './components/Settings';

export async function SettingsPage() {
  const customer = await requireCustomer(ROUTES.settings);
  const groups = await listOrderGroups();

  return (
    <Settings
      customer={customer}
      openOrders={countOpen(groups)}
    />
  );
}
