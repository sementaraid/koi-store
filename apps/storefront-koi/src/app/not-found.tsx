import type { Metadata } from 'next';
import { FishOff } from 'lucide-react';

import { Button } from "@koi/ui";
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

export default async function NotFound() {
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
