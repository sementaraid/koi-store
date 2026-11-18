import { toPartnerFarm } from '@/lib/adapters/seller';
import { listSellers } from '@/lib/data/seller';
import { getShell } from '@/lib/shell';

import { Partners } from './components/Partners';

export async function PartnersPage() {
  const [{ account, cart }, { sellers, count }] = await Promise.all([
    getShell(),
    listSellers()
  ]);

  return (
    <Partners
      farms={sellers.map(toPartnerFarm)}
      total={count}
      account={account}
      cart={cart}
    />
  );
}
