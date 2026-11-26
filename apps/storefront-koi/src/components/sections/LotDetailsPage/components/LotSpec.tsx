import type { ReactNode } from 'react';

import { SECTION_LABEL } from '@/const/layout';
import type { AuctionProduct } from '@/types/product';

// US-098 AC14 / US-105 AC6: only fields the lot actually carries. A legacy lot
// (or an empty optional field) draws no row, never a blank one.

function Row({
  label,
  order,
  children
}: {
  label: string;
  /* Board 02 lists the rows in one order on a phone; board 09 pairs them in
     two columns in another (Varietas · Jenis kelamin on the first line). */
  order?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-b border-divider py-3 text-sm last:border-b-0 lg:last:border-b ${order ?? ''}`}
    >
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-end font-semibold text-pretty">{children}</dd>
    </div>
  );
}

type SpecRow = { key: string; label: string; value?: ReactNode; order: string };

export function LotSpec({ lot }: { lot: AuctionProduct }) {
  const { listing } = lot;
  const size = listing?.sizeCm !== undefined ? `${listing.sizeCm} cm` : undefined;
  // D-081: with a certificate show its issuer, without one the fixed label.
  const certificate =
    listing?.hasCertificate === true
      ? listing.certificateIssuer ?? 'Ada'
      : listing?.hasCertificate === false
        ? listing.certificateIssuer ?? 'Tidak ada (koi lokal)'
        : undefined;

  // Board 02 (phone) order; the `lg:` order classes pair the rows for board 09.
  const rows: SpecRow[] = [
    { key: 'variety', label: 'Varietas', value: listing?.variety, order: 'lg:order-1' },
    { key: 'size', label: 'Ukuran', value: size, order: 'lg:order-3' },
    { key: 'age', label: 'Umur', value: listing?.age, order: 'lg:order-5' },
    { key: 'sex', label: 'Jenis kelamin', value: listing?.sex, order: 'lg:order-2' },
    {
      key: 'certificate',
      label: 'Sertifikat',
      value: certificate,
      order: 'lg:order-4'
    },
    {
      key: 'pond',
      label: 'Asal kolam',
      value: listing?.pondOrigin,
      order: 'lg:order-6'
    }
  ].filter((row) => row.value !== undefined && row.value !== null && row.value !== '');

  return (
    <div className="flex flex-col gap-6">
      <dl className="lg:grid lg:grid-cols-2 lg:gap-x-10">
        {rows.map((row) => (
          <Row key={row.key} label={row.label} order={row.order}>
            {row.value}
          </Row>
        ))}
      </dl>

      {listing?.note ? (
        <div className="flex flex-col gap-2">
          <h3 className={SECTION_LABEL}>Catatan farm</h3>
          <p className="text-[15px] leading-[22px] whitespace-pre-line text-pretty lg:text-sm lg:leading-[26px]">
            {listing.note}
          </p>
        </div>
      ) : null}

      {listing?.breederNotes ? (
        <div className="flex max-w-[680px] flex-col gap-2">
          <h3 className={SECTION_LABEL}>Catatan breeder</h3>
          <p className="text-[15px] leading-[22px] whitespace-pre-line text-pretty lg:text-sm lg:leading-[26px]">
            {listing.breederNotes}
          </p>
        </div>
      ) : null}
    </div>
  );
}
