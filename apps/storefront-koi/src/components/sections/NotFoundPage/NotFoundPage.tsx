import { FishOff } from 'lucide-react';

import { Button } from '@koi/ui';
import { Link } from '@/components/atoms/Link/Link';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { PageTrail } from '@/components/cells/PageBreadcrumb/PageBreadcrumb';
import { CONTAINER } from '@/const/layout';
import { ROUTES } from '@/const/routes';

/**
 * The 404 card with its breadcrumb. A `not-found.tsx` inside a route group
 * renders it under that group's layout shell; the root `not-found.tsx` wraps it
 * in the shell itself, because an unmatched URL matches no group.
 */
export function NotFoundPage() {
  return (
    <>
      <PageTrail trail={[{ label: 'Beranda', href: ROUTES.home }, { label: '404' }]} />
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
    </>
  );
}
