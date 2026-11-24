import { BadgeCheck, ShieldCheck, Video } from "lucide-react"

import { TRUST_CLAIMS } from "@/const/trust"
import { TrustLine } from "@/components/cells/TrustLine/TrustLine"
import { RenderIf } from "@koi/ui"
import type { SellerKind } from "@/types/product"

export type LotTrustListProps = {
  sellerKind?: SellerKind
  koi?: boolean
  className?: string
}

export function LotTrustList({
  sellerKind,
  koi = true,
  className,
}: LotTrustListProps) {
  const { escrow, liveGuarantee, breeder } = TRUST_CLAIMS

  return (
    <ul className={className ?? "flex flex-col"}>
      <TrustLine icon={ShieldCheck} title={escrow.title} body={escrow.body} />
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
    </ul>
  )
}
