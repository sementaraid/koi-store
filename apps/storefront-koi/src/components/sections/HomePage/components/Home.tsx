import { BadgeCheck, Gavel } from "lucide-react"

import { Badge } from "@/components/atoms/Badge/Badge"
import { Button } from "@/components/atoms/Button/Button"
import { Link } from "@/components/atoms/Link/Link"
import { CONTAINER } from "@/const/layout"
import { ROUTES, lotHref } from "@/const/routes"
import {
  DEFAULT_FEATURED,
  DEFAULT_HOME_CLAIMS,
  DEFAULT_HOME_PARTNERS,
  DEFAULT_HOME_STATS,
  DEFAULT_LOTS,
} from "@/const/home"
import { Eyebrow } from "@/components/atoms/Eyebrow/Eyebrow"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
import { PartnerCard } from "@/components/organisms/PartnerCard/PartnerCard"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import type { HomeProps } from "@/types/home"

export type { HomeClaim, HomeProps, HomeStat } from "@/types/home"
export type {
  PartnerCardProps,
  PartnerFact,
  PartnerFarm,
} from "@/components/organisms/PartnerCard/PartnerCard"

/**
 * The house's front page: the bar, the hero, the floor, and the footer.
 *
 * Data in, page out — the same seam every koi module uses. It does not fetch,
 * bid or route: the app hands it lots, or it falls back to the kit's demo floor,
 * which is what Storybook and a fresh checkout render.
 *
 * @remarks
 * Signed out unless an `account` arrives, because a landing page meets a
 * visitor and the bar's Masuk/Daftar pair is that meeting.
 *
 * Known cross-links go through {@link ROUTES}: plain anchors the koi `Link`
 * draws, so the router swap is one file's worth of change rather than a rewrite.
 * Search stays on {@link Header}'s native GET fallback until a router owns
 * `/catalog`.
 *
 * @example
 * // App, once the API exists
 * const { featured, lots } = useHomeLots()
 * <Home featured={featured} lots={lots} account={session} />
 */
export function Home({
  featured = DEFAULT_FEATURED,
  lots = DEFAULT_LOTS,
  stats = DEFAULT_HOME_STATS,
  claims = DEFAULT_HOME_CLAIMS,
  partners = DEFAULT_HOME_PARTNERS,
  account,
  activeHref = ROUTES.home,
  onSearch,
  className,
  ...props
}: HomeProps) {
  return (
    <PageShell
      data-slot="home"
      className={className}
      activeHref={activeHref}
      onSearch={onSearch}
      account={account}
      {...props}
    >
      {/* Hero: the pitch on the left, the lot that is closing on the right. */}
      <section className={`${CONTAINER} py-10 lg:py-16`}>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-5">
            <Badge variant="live" className="h-6 gap-1.5 px-3">
              <PulseIcon />
              Lelang Live
            </Badge>

            <h1 className="font-heading text-3xl leading-tight font-extrabold text-balance sm:text-4xl lg:text-5xl">
              Rumah lelang koi bersertifikat, langsung dari breeder.
            </h1>

            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Bid Nishikigoi pilihan dari farm terverifikasi. Setiap lot
              melewati karantina BBKP, datang dengan sertifikat breeder, dan
              dijamin hidup sampai ke kolam Anda.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                render={<Link href={ROUTES.catalogs} />}
                nativeButton={false}
              >
                <Gavel aria-hidden />
                Jelajahi Katalog Koi
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href={ROUTES.guide} />}
                nativeButton={false}
              >
                Cara Bidding
              </Button>
            </div>

            <RenderIf when={stats.length ? stats : null}>
              {(figures) => (
                <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-4">
                  {figures.map(({ value, label }) => (
                    <div key={label}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="text-xl font-bold text-accent-ink tabular-nums">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </RenderIf>
          </div>

          {/* The one lot worth a full tile: the next one to close. */}
          <div className="w-full max-w-md justify-self-start lg:justify-self-end">
            <ProductCard
              product={featured}
              href={lotHref(featured.id)}
              action={
                <Button size="md" className="flex-1">
                  <Gavel aria-hidden />
                  Pasang Bid
                </Button>
              }
            />
          </div>
        </div>
      </section>

      {/* The floor itself. An empty list drops the band — a heading over an
            empty grid reads as a broken page, not an idle one. */}
      <RenderIf when={lots.length ? lots : null}>
        {(items) => (
          <section className="border-y border-border bg-muted/40">
            <div className={`${CONTAINER} py-10 lg:py-14`}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <Eyebrow>Sedang Dibuka</Eyebrow>
                  <h2 className="font-heading text-2xl font-bold">
                    Lot yang ditutup hari ini
                  </h2>
                </div>
                <Link
                  href={ROUTES.auctions}
                  className="text-sm font-medium text-accent-ink underline-offset-4 hover:underline"
                >
                  Lihat semua lot
                </Link>
              </div>

              <FeedGrid>
                {items.map((lot) => (
                  <ProductCard
                    key={lot.id}
                    product={lot}
                    href={lotHref(lot.id)}
                    action={
                      <Button size="sm" variant="outline" className="flex-1">
                        Lihat detail
                      </Button>
                    }
                  />
                ))}
              </FeedGrid>
            </div>
          </section>
        )}
      </RenderIf>

      {/* The verified-breeder directory: who stands behind the lots, and the
            way into each farm. Empty list drops the band, as the floor does. */}
      <RenderIf when={partners.length ? partners : null}>
        {(farms) => (
          <section className="border-t border-border bg-muted/40">
            <div className={`${CONTAINER} py-10 lg:py-14`}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <Eyebrow>
                    <BadgeCheck aria-hidden className="size-3.5" />
                    Sentra Budidaya Resmi Terverifikasi
                  </Eyebrow>
                  <h2 className="font-heading text-2xl font-bold">
                    Mitra breeder Niigata, Blitar &amp; Sukabumi
                  </h2>
                  <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                    Semua kolam mitra melewati inspeksi parameter air,
                    biosecurity karantina BBKP, dan akurasi riwayat silsilah
                    indukan F0.
                  </p>
                </div>
                <Link
                  href={ROUTES.partners}
                  className="text-sm font-medium text-accent-ink underline-offset-4 hover:underline"
                >
                  Lihat semua 24 mitra kolam
                </Link>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {farms.map((farm) => (
                  <PartnerCard key={farm.id} partner={farm} />
                ))}
              </div>
            </div>
          </section>
        )}
      </RenderIf>

      {/* Why the house, in three claims. */}
      <RenderIf when={claims.length ? claims : null}>
        {(panels) => (
          <section className={`${CONTAINER} py-10 lg:py-14`}>
            <div className="mb-6 flex flex-col gap-1">
              <Eyebrow>Jaminan Kami</Eyebrow>
              <h2 className="font-heading text-2xl font-bold">
                Kenapa lelang di Mafia Koi Jogja
              </h2>
            </div>

            <ul className="grid gap-5 md:grid-cols-3">
              {panels.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="flex flex-col gap-2 rounded-xl bg-card p-5 shadow-[inset_0_1px_0_oklch(1_0_0/25%),0_1px_2px_oklch(0_0_0/8%),0_8px_16px_-8px_oklch(0_0_0/16%)] inset-ring-1 inset-ring-black/10"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-accent-ink">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold">{title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </RenderIf>

      {/* Closing ask. */}
      <section className="bg-muted/40">
        <div className={`${CONTAINER} py-14`}>
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <h2 className="max-w-lg font-heading text-2xl font-bold">
              Siap ikut lelang pertama Anda?
            </h2>
            <p className="max-w-md text-sm leading-relaxed">
              Daftar gratis, verifikasi identitas sekali, lalu langsung bid di
              lelang live berikutnya.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <Button
                size="lg"
                render={<Link href={ROUTES.signup} />}
                nativeButton={false}
              >
                Daftar Sekarang
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href={ROUTES.contact} />}
                nativeButton={false}
              >
                Hubungi Admin
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
