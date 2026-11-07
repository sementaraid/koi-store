import { ROUTES } from '@/const/routes';
import { requireCustomer } from '@/lib/guard';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { Messages } from './components/Messages';
import { countOpen } from './components/Orders';

/** Every conversation the customer has with the shops. */
export async function MessagesPage() {
  const [, { account, cart }, groups] = await Promise.all([
    requireCustomer(ROUTES.messages),
    getShell(),
    listOrderGroups()
  ]);

  return (
    <Messages
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    />
  );
}
