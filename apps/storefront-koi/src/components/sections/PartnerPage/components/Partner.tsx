import { BadgeCheck, Fish, MapPin, PackageCheck, Star } from 'lucide-react';

import { Badge, Button, RenderIf } from "@koi/ui";
import { ChatButton } from '@/components/cells/ChatButton/ChatButton';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { Eyebrow } from '@/components/atoms/Eyebrow/Eyebrow';
import { FeedGrid } from '@/components/atoms/FeedGrid/FeedGrid';
import { Stars } from '@/components/atoms/Stars/Stars';
import { FeedPagination } from '@/components/cells/FeedPagination/FeedPagination';
import { Link } from '@/components/atoms/Link/Link';
import { PageTrail } from '@/components/cells/PageBreadcrumb/PageBreadcrumb';
import { ProductCard } from '@/components/organisms/ProductCard/ProductCard';
import { CONTAINER, SECTION_LABEL } from '@/const/layout';
import { ROUTES, koiHref, partnerHref } from '@/const/routes';
import { formatAgo } from '@/lib/helpers/format-ago';
import type { PartnerProfile } from '@/lib/adapters/seller';
import type { SellerRatings } from '@/lib/data/ratings';
import type { SimpleProduct } from '@/types/product';

export type PartnerProps = {
  partner: PartnerProfile;
  ratings: SellerRatings;
  shelf: SimpleProduct[];
  total: number;
  page: number;
  pageCount: number;
  handle: string;
};

export function Partner({
  partner,
  ratings,
  shelf,
  total,
  page,
  pageCount,
  handle
}: PartnerProps) {
  const { name, description, logo, location, speciality, premium, joinedAt } =
    partner;

  return (
    <>
      <PageTrail
        trail={[
          { label: 'Beranda', href: ROUTES.home },
          { label: 'Mitra', href: ROUTES.partners },
          { label: name }
        ]}
      />
      <section className="border-b border-border bg-muted/40">
        <div className={`${CONTAINER} py-8 lg:py-10`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <RenderIf when={logo}>
                {(src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                )}
              </RenderIf>
              <RenderIf when={!logo}>
                {() => (
                  <span
                    aria-hidden
                    className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl font-bold text-accent-ink"
                  >
                    {name.charAt(0)}
                  </span>
                )}
              </RenderIf>

              <div className="flex min-w-0 flex-col gap-2">
                <Eyebrow>
                  <BadgeCheck aria-hidden className="size-3.5" />
                  Mitra Terverifikasi
                </Eyebrow>
                <h1 className="font-heading text-3xl font-extrabold lg:text-4xl">
                  {name}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <RenderIf when={location}>
                    {(where) => (
                      <span className="flex items-center gap-1">
                        <MapPin aria-hidden className="size-3.5" />
                        {where}
                      </span>
                    )}
                  </RenderIf>
                  <RenderIf when={speciality}>
                    {(what) => <span>Spesialis: {what}</span>}
                  </RenderIf>
                  <RenderIf when={joinedAt}>
                    {(since) => <span>Bergabung {formatAgo(since)}</span>}
                  </RenderIf>
                </div>

                <RenderIf when={premium}>
                  {() => (
                    <Badge variant="attention" className="w-fit gap-1.5">
                      <Star aria-hidden className="size-3" />
                      Breeder pilihan
                    </Badge>
                  )}
                </RenderIf>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ChatButton
                partner={{
                  id: partner.id,
                  name,
                  ...(logo ? { photoUrl: logo } : {})
                }}
                subject={name}
                topicId={partner.id}
                variant="soft"
              />

              <Badge variant="live" className="gap-1.5 px-3">
                <PackageCheck aria-hidden />
                {total} listing aktif
              </Badge>
            </div>
          </div>

          <RenderIf when={description}>
            {(bio) => (
              <p className="mt-6 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {bio}
              </p>
            )}
          </RenderIf>
        </div>
      </section>

      <RenderIf when={ratings.count > 0 ? ratings : null}>
        {(data) => (
          <section aria-labelledby="partner-ratings">
            <div className={`${CONTAINER} py-8 lg:py-10`}>
              <h2 id="partner-ratings" className={`${SECTION_LABEL} mb-1`}>
                Penilaian
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {data.average === null ? '—' : String(data.average).replace('.', ',')}
                </span>{' '}
                · {data.count} penilaian
              </p>

              <ul className="flex flex-col divide-y divide-border">
                {data.ratings.map((rating) => (
                  <li key={rating.id} className="flex flex-col gap-1 py-4 first:pt-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Stars value={rating.stars} />
                      <span className="text-sm font-medium">{rating.rater.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatAgo(rating.created_at)}
                      </span>
                    </div>
                    <RenderIf when={rating.comment}>
                      {(comment) => (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {comment}
                        </p>
                      )}
                    </RenderIf>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </RenderIf>

      <section aria-labelledby="partner-shelf">
        <div className={`${CONTAINER} py-8 lg:py-10`}>
          <h2 id="partner-shelf" className={`${SECTION_LABEL} mb-6`}>
            Dijual oleh {name}
          </h2>

          <RenderIf when={shelf.length ? shelf : null}>
            {(list) => (
              <FeedGrid>
                {list.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    href={koiHref(item.id)}
                    action={
                      <Button
                        render={<Link href={koiHref(item.id)} />}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        Lihat detail
                      </Button>
                    }
                  />
                ))}
              </FeedGrid>
            )}
          </RenderIf>

          <RenderIf when={!shelf.length}>
            {() => (
              <EmptyFeed
                icon={<Fish aria-hidden />}
                narrowing={false}
                noMatchTitle="Belum ada ikan yang dijual"
                noMatchBody="Kolam ini sedang tidak membuka penjualan. Lihat mitra lain, atau koi yang sedang dilelang."
                action={
                  <Button
                    render={<Link href={ROUTES.partners} />}
                    nativeButton={false}
                  >
                    Lihat mitra lain
                  </Button>
                }
              />
            )}
          </RenderIf>

          <FeedPagination
            page={page}
            pageCount={pageCount}
            href={partnerHref(handle)}
            className="mt-8"
          />
        </div>
      </section>
    </>
  );
}
