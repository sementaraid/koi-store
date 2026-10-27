import { BadgeCheck, Fish, MapPin, PackageCheck, Star } from 'lucide-react';

import { Badge } from '@/components/atoms/Badge/Badge';
import { Button } from '@/components/atoms/Button/Button';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { Eyebrow } from '@/components/atoms/Eyebrow/Eyebrow';
import { FeedGrid } from '@/components/atoms/FeedGrid/FeedGrid';
import { FeedPagination } from '@/components/cells/FeedPagination/FeedPagination';
import { Link } from '@/components/atoms/Link/Link';
import { PageShell } from '@/components/organisms/PageShell/PageShell';
import { ProductCard } from '@/components/organisms/ProductCard/ProductCard';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { CONTAINER, SECTION_LABEL } from '@/const/layout';
import { ROUTES, koiHref, partnerHref } from '@/const/routes';
import { formatAgo } from '@/lib/helpers/format-ago';
import type { PartnerProfile } from '@/lib/adapters/seller';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { SimpleProduct } from '@/types/product';

/** Props for {@link Partner}. */
export type PartnerProps = {
  partner: PartnerProfile;
  /** What this breeder has listed, this page's worth. */
  shelf: SimpleProduct[];
  /** Offers the breeder has in all, across every page. */
  total: number;
  page: number;
  pageCount: number;
  /** The breeder's handle, so the pager's links land back on this page. */
  handle: string;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/**
 * One breeder's own page: who they are, and everything they have listed.
 *
 * @remarks
 * The shelf is built from *offers*, not products, which is what makes this
 * different from the catalog with a filter on it — a breeder's page quotes the
 * breeder's own price for a koi even where another seller undercuts them on the
 * same master product.
 *
 * Presentational: the caller fetches, ranks and maps. No chat control, unlike
 * `apps/storefront`'s `SellerHeading` — the messaging feature has no backend in
 * this project (see the note in the parity plan), so a "Hubungi breeder" button
 * would open nothing.
 */
export function Partner({
  partner,
  shelf,
  total,
  page,
  pageCount,
  handle,
  account,
  cart
}: PartnerProps) {
  const { name, description, logo, location, speciality, premium, joinedAt } =
    partner;

  return (
    <PageShell
      activeHref={ROUTES.partners}
      account={account}
      cart={cart}
      trail={[
        { label: 'Beranda', href: ROUTES.home },
        { label: 'Mitra', href: ROUTES.partners },
        { label: name }
      ]}
    >
      {/* The identity band, in the same material the feed pages open with. */}
      <section className="border-b border-border bg-muted/40">
        <div className={`${CONTAINER} py-8 lg:py-10`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              {/* The mark where the breeder has one, the monogram where they do
                  not — the same fallback the directory card draws, so a farm
                  reads the same in a grid and on its own page. */}
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

            <Badge variant="live" className="h-7 gap-1.5 px-3 text-[13px]">
              <PackageCheck aria-hidden />
              {total} listing aktif
            </Badge>
          </div>

          {/* The breeder's own words, as text. Not HTML: see the remark on
              `toPartnerProfile`. */}
          <RenderIf when={description}>
            {(bio) => (
              <p className="mt-6 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {bio}
              </p>
            )}
          </RenderIf>
        </div>
      </section>

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
                      <Button size="sm" variant="outline" className="flex-1">
                        Lihat detail
                      </Button>
                    }
                  />
                ))}
              </FeedGrid>
            )}
          </RenderIf>

          {/* An open breeder with nothing listed is a real state — a farm
              between harvests — so there is no narrowing branch to word: this
              shelf has no filters on it. */}
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
    </PageShell>
  );
}
