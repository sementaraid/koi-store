import { toPartnerFarm } from '@/lib/adapters/seller';
import { listSellers } from '@/lib/data/seller';

import { Partners } from './components/Partners';

export async function PartnersPage() {
  const { sellers, count } = await listSellers();

  return (
    <Partners
      farms={sellers.map(toPartnerFarm)}
      total={count}
    />
  );
}
