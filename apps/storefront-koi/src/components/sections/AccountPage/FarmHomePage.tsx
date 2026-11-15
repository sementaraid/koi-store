import { Sprout } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { ROUTES } from '@/const/routes';
import { requireCustomer } from '@/lib/guard';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { AccountFrame } from './components/AccountFrame';

/** The Farmer area home.
 *
 * @remarks
 * A placeholder until US-030 builds auctions here. It still asks for the
 * customer session, so an approved farmer's link from the status card lands on
 * a page that knows whose area it is. */
export async function FarmHomePage() {
  const [, { account, cart }, groups] = await Promise.all([
    requireCustomer(ROUTES.farmHome),
    getShell(),
    listOrderGroups()
  ]);

  return (
    <AccountFrame
      title="Area petani"
      eyebrow={
        <>
          <Sprout aria-hidden className="size-3.5" />
          Kebun
        </>
      }
      description="Tempat mengelola lelang dan lot Anda."
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    >
      <Card className="px-5 py-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">Lelang segera hadir</CardTitle>
          <CardDescription>
            Pembuatan lelang dan lot dikerjakan pada tahap berikutnya. Sampai saat itu, pantau
            status kebun Anda di halaman Kebun.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </AccountFrame>
  );
}
