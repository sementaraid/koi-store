import { BadgeCheck, Gavel } from "lucide-react"

import { Badge, Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { CONTAINER } from "@/const/layout"
import { ROUTES, auctionsTabHref, lotHref } from "@/const/routes"
import { SITE_NAME } from "@/const/site"
import { DEFAULT_HOME_CLAIMS } from "@/const/home"
import { Eyebrow } from "@/components/atoms/Eyebrow/Eyebrow"
import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { PartnerCard } from "@/components/organisms/PartnerCard/PartnerCard"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"
import { AuctionProductCard } from "@/components/organisms/ProductCard/AuctionProductCard"
import type { HomeProps } from "@/types/home"

export type { HomeClaim, HomeProps } from "@/types/home"
export type {
  PartnerCardProps,
  PartnerFact,
  PartnerFarm,
} from "@/components/organisms/PartnerCard/PartnerCard"

export function Home({
  featured,
  lots = [],
  lotsFailed = false,
  claims = DEFAULT_HOME_CLAIMS,
  partners,
  now,
  className,
  ...props
}: HomeProps) {
  return (
    <div data-slot="home" className={className} {...props}>
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
                Cara bid
              </Button>
            </div>
          </div>

          <div className="w-full max-w-md justify-self-start lg:justify-self-end">
            {featured ? (
              <AuctionProductCard product={featured} href={lotHref(featured.id)} now={now} />
            ) : (
              <div
                data-slot="hero-fallback"
                className="flex flex-col items-start gap-3 rounded-control border border-border bg-card p-5"
              >
                <h2 className="font-heading text-lg font-bold">
                  {lotsFailed ? "Lot belum bisa dimuat" : "Belum ada lot yang dibuka"}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {lotsFailed
                    ? "Daftar lot sedang tidak bisa diambil. Buka halaman lelang untuk melihat lot terbaru."
                    : "Lot muncul di sini begitu lelangnya live. Lihat lelang yang akan datang."}
                </p>
                <Button
                  variant="outline"
                  render={
                    <Link
                      href={lotsFailed ? ROUTES.auctions : auctionsTabHref("upcoming")}
                    />
                  }
                  nativeButton={false}
                >
                  {lotsFailed ? "Lihat semua lelang" : "Lihat lelang akan datang"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

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
                  className="rounded-sm text-sm font-medium text-accent-ink underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring max-md:-my-3 max-md:py-3"
                >
                  Lihat semua lot
                </Link>
              </div>

              <FeedGrid>
                {items.map((lot) => (
                  <AuctionProductCard
                    key={lot.id}
                    product={lot}
                    href={lotHref(lot.id)}
                    now={now}
                  />
                ))}
              </FeedGrid>
            </div>
          </section>
        )}
      </RenderIf>

      <RenderIf when={partners?.length ? partners : null}>
        {(farms) => (
          <section className="border-t border-border bg-muted/40">
            <div className={`${CONTAINER} py-10 lg:py-14`}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <Eyebrow>
                    <BadgeCheck aria-hidden className="size-3.5" />
                    Mitra terverifikasi
                  </Eyebrow>
                  <h2 className="font-heading text-2xl font-bold">
                    Mitra breeder
                  </h2>
                </div>
                <Link
                  href={ROUTES.partners}
                  className="text-sm font-medium text-accent-ink underline-offset-4 hover:underline"
                >
                  Lihat semua mitra
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

      <RenderIf when={claims.length ? claims : null}>
        {(panels) => (
          <section className={`${CONTAINER} py-10 lg:py-14`}>
            <div className="mb-6 flex flex-col gap-1">
              <Eyebrow>Jaminan Kami</Eyebrow>
              <h2 className="font-heading text-2xl font-bold">
                Kenapa lelang di {SITE_NAME}
              </h2>
            </div>

            <ul className="grid gap-5 md:grid-cols-3">
              {panels.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="flex flex-col gap-2 rounded-control border border-border bg-card p-5"
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
    </div>
  )
}
