import type { ReactNode } from "react"

import { Link } from "@/components/atoms/Link/Link"
import { SECTION_LABEL } from "@/const/layout"
import { partnerHref } from "@/const/routes"
import type { AuctionProduct } from "@/types/product"

// AC4: only fields the API actually returns. Variety, size, age, sex and
// certificate stay hidden until mvp-Q58 is answered, so no empty row ever ships.
const DELIVERY_LABEL: Record<string, string> = {
  courier: "Kurir",
  self_delivery: "Antar sendiri",
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-divider py-3 text-sm last:border-b-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-end font-semibold text-pretty">{children}</dd>
    </div>
  )
}

export function LotSpec({ lot }: { lot: AuctionProduct }) {
  const { listing, auction } = lot
  const delivery = auction.deliveryMethod
    ? DELIVERY_LABEL[auction.deliveryMethod] ?? auction.deliveryMethod
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <dl>
        {listing?.seller ? (
          <Row label="Farm">
            {listing.sellerHandle ? (
              <Link
                href={partnerHref(listing.sellerHandle)}
                className="underline-offset-2 hover:underline"
              >
                {listing.seller}
              </Link>
            ) : (
              listing.seller
            )}
          </Row>
        ) : null}
        {listing?.category ? <Row label="Kategori">{listing.category}</Row> : null}
        {delivery ? <Row label="Pengiriman">{delivery}</Row> : null}
      </dl>

      {listing?.note ? (
        <div className="flex flex-col gap-2">
          <h3 className={SECTION_LABEL}>Catatan farm</h3>
          <p className="text-sm leading-relaxed whitespace-pre-line text-pretty">
            {listing.note}
          </p>
        </div>
      ) : null}
    </div>
  )
}
