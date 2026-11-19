import { BadgeCheck, ShieldCheck, Video, Wallet } from "lucide-react"

import { Link } from "@/components/atoms/Link/Link"
import { ROUTES } from "@/const/routes"
import { TRUST_CLAIMS } from "@/const/trust"
import { TrustLine } from "@/components/cells/TrustLine/TrustLine"
import { RenderIf } from "@koi/ui"
import type { SellerKind } from "@/types/product"

export type LotTrustListProps = {
  sellerKind?: SellerKind
  koi?: boolean
  variant?: "page" | "room"
  signedIn?: boolean
  className?: string
}

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
            title="Pembayaran lewat rekber."
            body={
              signedIn
                ? "Dana ditahan sampai ikan diterima."
                : "Masuk untuk melihat tagihan Anda."
            }
            action={
              <Link href={signedIn ? ROUTES.orders : ROUTES.login} className="font-bold">
                {signedIn ? "Lihat tagihan" : "Masuk"}
              </Link>
            }
          />
        )}
      </RenderIf>
    </ul>
  )
}
