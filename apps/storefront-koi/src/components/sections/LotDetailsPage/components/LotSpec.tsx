import type { ReactNode } from "react"

import { Link } from "@/components/atoms/Link/Link"
import { SECTION_LABEL } from "@/const/layout"
import { partnerHref } from "@/const/routes"
import type { AuctionProduct } from "@/types/product"

// US-098 AC14 / US-105 AC6: only fields the lot actually carries. A legacy lot
// (or an empty optional field) draws no row, never a blank one.
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
  const size = listing?.sizeCm !== undefined ? `${listing.sizeCm} cm` : undefined
  // D-081: with a certificate show its issuer, without one the fixed label.
  const certificate =
    listing?.hasCertificate === true
      ? listing.certificateIssuer ?? "Ada"
      : listing?.hasCertificate === false
        ? listing.certificateIssuer ?? "Tidak ada (koi lokal)"
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
        {listing?.variety ? <Row label="Varietas">{listing.variety}</Row> : null}
        {size ? <Row label="Ukuran">{size}</Row> : null}
        {listing?.age ? <Row label="Umur">{listing.age}</Row> : null}
        {listing?.sex ? <Row label="Jenis kelamin">{listing.sex}</Row> : null}
        {certificate ? <Row label="Sertifikat">{certificate}</Row> : null}
        {listing?.pondOrigin ? <Row label="Asal kolam">{listing.pondOrigin}</Row> : null}
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

      {listing?.breederNotes ? (
        <div className="flex flex-col gap-2">
          <h3 className={SECTION_LABEL}>Catatan breeder</h3>
          <p className="text-sm leading-relaxed whitespace-pre-line text-pretty">
            {listing.breederNotes}
          </p>
        </div>
      ) : null}
    </div>
  )
}
