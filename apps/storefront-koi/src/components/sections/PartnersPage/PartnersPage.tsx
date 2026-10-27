import { toPartnerFarm } from '@/lib/adapters/seller';
import { listSellers } from '@/lib/data/seller';
import { getShell } from '@/lib/shell';

import { Partners } from './components/Partners';

/**
 * The breeder directory: every seller the marketplace has open.
 *
 * @remarks
 * The data side is `GET /store/sellers`, which already excludes sellers that
 * are not `open` or are inside a closure window — so the directory is the
 * public list, with no filter of its own. Koi's home page has linked `/mitra`
 * and six `/mitra/<handle>` farm pages since the kit was ported; only the
 * routes were missing.
 */
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
