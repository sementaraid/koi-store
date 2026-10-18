import { BadgeCheck, ShieldCheck, Video, Wallet } from "lucide-react"

import { Link } from "@/components/atoms/Link/Link"
import { ROUTES } from "@/const/routes"
import { TRUST_CLAIMS } from "@/const/trust"
import { TrustLine } from "@/components/cells/TrustLine/TrustLine"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import type { SellerKind } from "@/types/product"

/** Props for {@link LotTrustList}. */
export type LotTrustListProps = {
  /** Who is selling. A shop breeds nothing, so it does not get to claim a
      breeder's verification — the line is dropped, not reworded. */
  sellerKind?: SellerKind
  /** Whether the thing being sold is a koi. The live-arrival promise is about a
      fish arriving alive; a sack of food arrives neither alive nor dead, so the
      line drops rather than promising a guarantee the house cannot keep.
      @defaultValue `true` — every surface but a shop good is a koi. */
  koi?: boolean
  /** Which list this is. `"page"` is a lot's own dossier: what the house
      promises, read rather than acted on. `"room"` is where the money moves, so
      the escrow is spelled out in full with its regulation linked, and the
      visitor's own deposit joins the list.
      @defaultValue `"page"` */
  variant?: "page" | "room"
  /** The visitor's account, in the room. Omitted, the deposit line asks them to
      sign in rather than claiming a balance they do not have. */
  signedIn?: boolean
  className?: string
}

/**
 * What backs the money, in the order a buyer checks it: the escrow, the live
 * guarantee, the breeder's verification, and — in the room — the visitor's own
 * deposit.
 *
 * @remarks
 * One list for both surfaces, because to a bidder these are one question asked
 * four ways, and the claim that must never be worded two ways is the one about
 * whose money is being held. The wording lives in `constant/trust.ts` and the
 * drawing here, so a page cannot invent a fifth promise in its own file.
 *
 * Every line is an `<li>`, so the caller gives the element: a `<ul>` where the
 * list stands alone, or a plain fragment inside one that already exists.
 *
 * @example
 * <ul className="flex flex-col">
 *   <LotTrustList variant="room" sellerKind={listing?.sellerKind} signedIn />
 * </ul>
 */
export function LotTrustList({
  sellerKind,
  koi = true,
  variant = "page",
  signedIn,
  className,
}: LotTrustListProps) {
  const { escrow, escrowLive, liveGuarantee, breeder } = TRUST_CLAIMS
  const room = variant === "room"
  const claim = room ? escrowLive : escrow

  return (
    <ul className={className ?? "flex flex-col"}>
      <TrustLine
        icon={ShieldCheck}
        title={claim.title}
        body={claim.body}
        action={
          <RenderIf when={room}>
            {() => (
              <Link href={ROUTES.escrow} className="font-bold">
                Regulasi
              </Link>
            )}
          </RenderIf>
        }
      />
      {/* A shelf good arrives neither alive nor bred, so the two claims that are
          about a live koi drop out rather than being reworded into a promise the
          house would have to keep on a sack of food. */}
      <RenderIf when={koi}>
        {() => (
          <>
            <TrustLine
              icon={Video}
              title={liveGuarantee.title}
              body={liveGuarantee.body}
            />
            <RenderIf when={sellerKind === "farm"}>
              {() => (
                <TrustLine
                  icon={BadgeCheck}
                  title={breeder.title}
                  body={breeder.body}
                />
              )}
            </RenderIf>
          </>
        )}
      </RenderIf>
      <RenderIf when={room}>
        {() => (
          <TrustLine
            icon={Wallet}
            title="Saldo deposit."
            body={
              signedIn
                ? "Siap dipakai di ruang ini."
                : "Masuk untuk memakai saldo."
            }
            action={
              <Link href={ROUTES.balance} className="font-bold">
                Top up
              </Link>
            }
          />
        )}
      </RenderIf>
    </ul>
  )
}
