import { ROUTES } from '@/const/routes';
import { requireCustomer } from '@/lib/guard';
import { getAccountIdentity } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { Messages } from './components/Messages';
import { countOpen } from './components/Orders';

export async function MessagesPage() {
  const [, identity, groups] = await Promise.all([
    requireCustomer(ROUTES.messages),
    getAccountIdentity(),
    listOrderGroups()
  ]);

  return (
    <Messages
      openOrders={countOpen(groups)}
      identity={identity}
    />
  );
}
