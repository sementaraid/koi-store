/* The farmer's sold-lot row (US-051 T-051.2b, D-056): what a lot's status
   reads as on the farmer's side, and how the winner's address is shown —
   masked (city + province) until the explicit reveal returns the full one. */

export type SoldLotStatus = 'won' | 'paid' | 'shipped' | 'delivered' | 'claimed';

/** A `Badge` tone, as `@koi/ui` names them. */
export type SoldLotTone = 'neutral' | 'info' | 'urgent' | 'muted' | 'attention' | 'live';

const STATUS_LABELS: Record<SoldLotStatus, { label: string; tone: SoldLotTone }> = {
  won: { label: 'Menunggu pembayaran', tone: 'attention' },
  paid: { label: 'Sudah dibayar', tone: 'info' },
  shipped: { label: 'Dikirim', tone: 'info' },
  delivered: { label: 'Diterima', tone: 'info' },
  claimed: { label: 'Klaim', tone: 'urgent' }
};

/** Label and tone for one sold lot's status. An unknown status reads as
    itself rather than throwing on a value this file has not heard of. */
export function soldLotStatusLabel(status: string): { label: string; tone: SoldLotTone } {
  return STATUS_LABELS[status as SoldLotStatus] ?? { label: status, tone: 'neutral' };
}

/** The masked address the sold-lot row carries (D-056): city and province
    only. `null` means the winner has no default shipping address. */
export type MaskedAddress = { city: string | null; province: string | null };

/** "Bandung, Jawa Barat", or the null address's own sentence. Whatever the
    backend did not send is simply left out — never a dangling comma. */
export function maskedAddressLabel(address: MaskedAddress | null): string {
  const parts = [address?.city, address?.province].filter(
    (part): part is string => Boolean(part)
  );
  return parts.length ? parts.join(', ') : 'Alamat belum diisi';
}

/** The full address a reveal returns. `null` fields are skipped line by line,
    so a half-filled address still reads. */
export type FullAddress = {
  first_name: string | null;
  last_name: string | null;
  address_1: string | null;
  address_2: string | null;
  postal_code: string | null;
  city: string | null;
  province: string | null;
  country_code: string | null;
};

/** The full address as display lines. A phone, if one ever appeared in the
    payload, is not part of this type and is never drawn (D-052). */
export function fullAddressLines(address: FullAddress): string[] {
  const name = [address.first_name, address.last_name].filter(Boolean).join(' ');
  const region = [address.city, address.province, address.postal_code]
    .filter((part): part is string => Boolean(part))
    .join(', ');
  /* The API sends an ISO code; "Id" on a shipping label reads as a typo. */
  const country = address.country_code === 'id' ? 'Indonesia' : address.country_code;
  return [name, address.address_1, address.address_2, region, country].filter(
    (line): line is string => Boolean(line && line.trim())
  );
}
