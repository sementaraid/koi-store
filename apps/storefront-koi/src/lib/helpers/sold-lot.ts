
export type SoldLotStatus = 'won' | 'paid' | 'shipped' | 'delivered' | 'claimed';

export type SoldLotTone = 'neutral' | 'info' | 'urgent' | 'muted' | 'attention' | 'live';

const STATUS_LABELS: Record<SoldLotStatus, { label: string; tone: SoldLotTone }> = {
  won: { label: 'Menunggu pembayaran', tone: 'attention' },
  paid: { label: 'Sudah dibayar', tone: 'info' },
  shipped: { label: 'Dikirim', tone: 'info' },
  delivered: { label: 'Diterima', tone: 'info' },
  claimed: { label: 'Klaim', tone: 'urgent' }
};

export function soldLotStatusLabel(status: string): { label: string; tone: SoldLotTone } {
  return STATUS_LABELS[status as SoldLotStatus] ?? { label: status, tone: 'neutral' };
}

export type MaskedAddress = { city: string | null; province: string | null };

export function maskedAddressLabel(address: MaskedAddress | null): string {
  const parts = [address?.city, address?.province].filter(
    (part): part is string => Boolean(part)
  );
  return parts.length ? parts.join(', ') : 'Alamat belum diisi';
}

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

export function fullAddressLines(address: FullAddress): string[] {
  const name = [address.first_name, address.last_name].filter(Boolean).join(' ');
  const region = [address.city, address.province, address.postal_code]
    .filter((part): part is string => Boolean(part))
    .join(', ');
  const country = address.country_code === 'id' ? 'Indonesia' : address.country_code;
  return [name, address.address_1, address.address_2, region, country].filter(
    (line): line is string => Boolean(line && line.trim())
  );
}
