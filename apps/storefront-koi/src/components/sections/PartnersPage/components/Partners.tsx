import { BadgeCheck, Users } from 'lucide-react';

import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { Eyebrow } from '@/components/atoms/Eyebrow/Eyebrow';
import { PartnerCard } from '@/components/organisms/PartnerCard/PartnerCard';
import { PageTrail } from '@/components/cells/PageBreadcrumb/PageBreadcrumb';
import { CONTAINER } from '@/const/layout';
import { ROUTES } from '@/const/routes';
import type { PartnerFarm } from '@/components/organisms/PartnerCard/PartnerCard';

export type PartnersProps = {
  farms: PartnerFarm[];
  total: number;
};

export function Partners({ farms, total }: PartnersProps) {
  return (
    <>
      <PageTrail trail={[{ label: 'Beranda', href: ROUTES.home }, { label: 'Mitra' }]} />
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
    </>
  );
}
