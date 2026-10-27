import type { Metadata } from 'next';
import { FishOff } from 'lucide-react';

import { Button } from '@/components/atoms/Button/Button';
import { Link } from '@/components/atoms/Link/Link';
import { CONTAINER } from '@/const/layout';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { PageShell } from '@/components/organisms/PageShell/PageShell';
import { ROUTES } from '@/const/routes';
import { getShell } from '@/lib/shell';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
  description: 'Alamat yang Anda buka tidak ada di portal ini.'
};

/**
 * The page a bad address lands on.
 *
 * @remarks
 * Inside the full shell rather than bare, which is the whole reason this file
 * exists: three code paths call `notFound()` — a lot, a product, an order — and
 * every one of them was rendering Next's unstyled default, with no bar, no
 * footer and no way out except the back button. A visitor who mistypes a lot id
 * is still a visitor with a cart.
 *
 * `EmptyFeed` with `narrowing={false}`, because that is the kit's own wording of
 * "there is nothing here and you cannot undo your way to it" — the same panel
 * an empty cart and a matchless catalog draw, so a 404 reads as part of the
 * site rather than as the framework showing through.
 */
export default async function NotFound() {
  /* A 404 is reachable while signed in, so the bar says who that is. The shell
     can fail on a bad session, and a broken 404 page is the one thing worse
     than a bare one. */
  const { account, cart } = await getShell().catch(() => ({
    account: undefined,
    cart: undefined
  }));

  return (
    <PageShell
      account={account}
      cart={cart}
      trail={[{ label: 'Beranda', href: ROUTES.home }, { label: '404' }]}
    >
      <div className={`${CONTAINER} py-16`}>
        <EmptyFeed
          icon={<FishOff aria-hidden />}
          narrowing={false}
          noMatchTitle="Halaman tidak ditemukan"
          noMatchBody="Alamat ini tidak ada, atau lot yang Anda cari sudah ditutup."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                render={<Link href={ROUTES.auctions} />}
                nativeButton={false}
              >
                Lihat lelang
              </Button>
              <Button
                variant="outline"
                render={<Link href={ROUTES.home} />}
                nativeButton={false}
              >
                Kembali ke beranda
              </Button>
            </div>
          }
        />
      </div>
    </PageShell>
  );
}
