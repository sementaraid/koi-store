import { BadgeCheck, Users } from 'lucide-react';

import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { Eyebrow } from '@/components/atoms/Eyebrow/Eyebrow';
import { PartnerCard } from '@/components/organisms/PartnerCard/PartnerCard';
import { PageShell } from '@/components/organisms/PageShell/PageShell';
import { CONTAINER } from '@/const/layout';
import { ROUTES } from '@/const/routes';
import type { PartnerFarm } from '@/components/organisms/PartnerCard/PartnerCard';
import type { HeaderAccount, HeaderCart } from '@/types/header';

/** Props for {@link Partners}. */
export type PartnersProps = {
  farms: PartnerFarm[];
  /** How many sellers the marketplace lists in all. */
  total: number;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/**
 * The directory of breeder farms the house has verified.
 *
 * @remarks
 * A plain grid rather than a filterable feed, on purpose: `GET /store/sellers`
 * returns the whole public list, and a marketplace at this scale lists fewer
 * farms than one screen of cards. `ponytail:` the day that stops being true,
 * this grows a pager (the count is already passed down) rather than a facet bar
 * — a breeder is looked up by name, not narrowed by price.
 *
 * Presentational: the caller fetches and maps. The shell is the page's own
 * because the directory is a public page and the bar still says who is signed
 * in.
 */
export function Partners({ farms, total, account, cart }: PartnersProps) {
  return (
    <PageShell
      activeHref={ROUTES.partners}
      account={account}
      cart={cart}
      trail={[{ label: 'Beranda', href: ROUTES.home }, { label: 'Mitra' }]}
    >
      <div className={`${CONTAINER} pb-16`}>
        <div className="mb-8 max-w-2xl">
          <Eyebrow>
            <BadgeCheck aria-hidden className="size-3.5" />
            Sentra Budidaya Resmi Terverifikasi
          </Eyebrow>
          <h1 className="mt-2 font-heading text-3xl font-extrabold lg:text-4xl">
            Mitra breeder
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {total > 0
              ? `${total} kolam mitra yang melewati inspeksi parameter air, biosecurity karantina BBKP, dan akurasi silsilah indukan.`
              : 'Kolam mitra yang melewati inspeksi parameter air, biosecurity karantina BBKP, dan akurasi silsilah indukan.'}
          </p>
        </div>

        {farms.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <PartnerCard key={farm.id} partner={farm} />
            ))}
          </div>
        ) : (
          <EmptyFeed
            icon={<Users aria-hidden />}
            narrowing={false}
            noMatchTitle="Belum ada mitra"
            noMatchBody="Direktori ini terisi begitu seller pertama dibuka di marketplace."
          />
        )}
      </div>
    </PageShell>
  );
}
