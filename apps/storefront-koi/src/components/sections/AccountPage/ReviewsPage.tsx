import { ROUTES } from '@/const/routes';
import { listMyReviews } from '@/lib/data/reviews';
import { requireCustomer } from '@/lib/guard';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Reviews } from './components/Reviews';

/** Every review the customer has written. */
export async function ReviewsPage() {
  const [, { account, cart }, reviews, groups] = await Promise.all([
    requireCustomer(ROUTES.reviews),
    getShell(),
    listMyReviews(),
    listOrderGroups()
  ]);

  return (
    <Reviews
      reviews={reviews}
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    />
  );
}
