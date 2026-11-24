import { ROUTES } from '@/const/routes';
import { listMyReviews } from '@/lib/data/reviews';
import { requireCustomer } from '@/lib/guard';
import { getAccountIdentity } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { Reviews } from './components/Reviews';

export async function ReviewsPage() {
  const [, identity, reviews, groups] = await Promise.all([
    requireCustomer(ROUTES.reviews),
    getAccountIdentity(),
    listMyReviews(),
    listOrderGroups()
  ]);

  return (
    <Reviews
      reviews={reviews}
      openOrders={countOpen(groups)}
      identity={identity}
    />
  );
}
