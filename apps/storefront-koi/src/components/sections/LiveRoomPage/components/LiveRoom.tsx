import { Gavel, History } from "lucide-react"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { SECTION_LABEL } from "@/const/layout"
import { ROUTES, lotHref } from "@/const/routes"
import { BidHistory } from "@/components/molecules/BidHistory/BidHistory"
import { LotTrustList } from "@/components/molecules/LotTrust/LotTrust"
import { SpecSheet } from "@/components/cells/SpecSheet/SpecSheet"
import { LotLayout } from "@/components/atoms/LotLayout/LotLayout"
import { LotLiveStage } from "@/components/organisms/LotLiveStage/LotLiveStage"
import { PageShell } from "@/components/organisms/PageShell/PageShell"
import { PlaceBid } from "@/components/sections/LotDetailsPage/components/PlaceBid"
import type { JoinControl } from "@/lib/helpers/join-auction"
import type { BidControl } from "@/lib/helpers/place-bid"
import { sessionLabel } from "@/lib/helpers/session-label"
import type { HeaderAccount, HeaderCart } from "@/types/header"
import type { MediaItem } from "@/types/lot"
import type { AuctionProduct } from "@/types/product"

const TRAIL_ROWS = 5

export function LiveRoom({
  lot,
  media,
  account,
  cart,
  join,
  bid,
  onEndTime,
}: {
  lot: AuctionProduct
  media: MediaItem[]
  account?: HeaderAccount
  cart?: HeaderCart
  join?: JoinControl
  bid?: BidControl
  onEndTime?: (endTime: string) => void
}) {
  const { listing, auction, info } = lot
  const bids = auction.bids ?? []

  return (
    <PageShell
      data-slot="live-room"
      activeHref={ROUTES.auctions}
      account={account}
      cart={cart}
      trail={[
        { label: "Lelang", href: ROUTES.auctions },
        { label: sessionLabel(listing?.seller) },
        { label: listing?.ref ?? `Lot ${lot.id}` },
        { label: "Ruang bidding" }
      ]}
    >
      <LotLayout
        media={
          <>
            <LotLiveStage
              items={media}
              {...(bids[0] ? { lastBid: bids[0] } : {})}
              currency={auction.currency}
            />

            <SpecSheet
              listing={listing}
              info={info}
              action={
                <Link href={lotHref(lot.id)} className="text-xs font-bold">
                  Detail lengkap lot →
                </Link>
              }
            />
          </>
        }
        aside={
          <>
            <RenderIf when={auction.live_stream_url}>
              {(url) => (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-info underline underline-offset-2"
                >
                  Tonton siaran langsung petani →
                </a>
              )}
            </RenderIf>

            <RenderIf when={bid}>
              {(control) => (
                <PlaceBid
                  {...control}
                  currentPrice={auction.currentBid}
                  {...(onEndTime ? { onEndTime } : {})}
                />
              )}
            </RenderIf>

            <RenderIf when={!bid}>
              {() => (
                <RenderIf when={join}>
                  {(control) => (
                    <Button
                      render={
                        <Link
                          href={lotHref(lot.id)}
                          className="w-full text-xs font-bold"
                        />
                      }
                      nativeButton={false}
                      size="lg"
                    >
                      <Gavel aria-hidden />
                      {control.mode === "join"
                        ? "Ikut lelang dulu untuk memasang bid"
                        : control.mode === "signed-out"
                          ? "Masuk dan ikut lelang untuk memasang bid"
                          : "Bidding tersedia saat lelang dimulai"}
                    </Button>
                  )}
                </RenderIf>
              )}
            </RenderIf>

            <RenderIf when={bids.length ? bids : null}>
              {(rows) => (
                <section className="flex flex-col gap-2">
                  <h2 className={SECTION_LABEL}>
                    <History aria-hidden className="inline size-3.5" /> Riwayat
                    bid
                  </h2>
                  <BidHistory
                    variant="inline"
                    bids={rows.slice(0, TRAIL_ROWS)}
                    currency={auction.currency}
                  />
                  <Link
                    href={lotHref(lot.id)}
                    className="text-xs font-bold text-muted-foreground hover:text-accent-ink"
                  >
                    Lihat semua {auction.bidCount ?? rows.length} bid →
                  </Link>
                </section>
              )}
            </RenderIf>

            <LotTrustList
              variant="room"
              sellerKind={listing?.sellerKind}
              signedIn={Boolean(account)}
              className="flex flex-col border-t border-border"
            />
          </>
        }
      />
    </PageShell>
  )
}
