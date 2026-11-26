import { formatDeadline } from './format-deadline.ts';
import { formatPrice } from './format-price.ts';

export type SoldLotStatus = 'won' | 'paid' | 'shipped' | 'delivered' | 'claimed';

export type SoldLotTone = 'neutral' | 'info' | 'urgent' | 'muted' | 'attention' | 'live';

const STATUS_LABELS: Record<SoldLotStatus, { label: string; tone: SoldLotTone }> = {
  won: { label: 'Menunggu pembayaran', tone: 'attention' },
  paid: { label: 'Dibayar', tone: 'info' },
  shipped: { label: 'Dikirim', tone: 'info' },
  delivered: { label: 'Diterima', tone: 'info' },
  claimed: { label: 'Klaim', tone: 'urgent' }
};

// US-108 AC4 (D-068): the farmer waits for the winner's transfer, so their row
// names the payer; the winner still reads "Menunggu pembayaran".
export function soldLotStatusLabel(
  status: string,
  view: 'winner' | 'farmer' = 'winner'
): { label: string; tone: SoldLotTone } {
  const entry = STATUS_LABELS[status as SoldLotStatus];
  if (!entry) return { label: status, tone: 'neutral' };
  if (view === 'farmer' && status === 'won') {
    return { label: 'Menunggu pembayaran pemenang', tone: entry.tone };
  }
  return entry;
}

export type SoldLotStepDate = {
  key: 'paid' | 'shipped' | 'delivered';
  label: string;
  // D-072/US-112 AC2: null when the step was reached before its date was saved.
  date: string | null;
};

const STEP_INDEX: Record<string, number> = {
  paid: 0,
  shipped: 1,
  delivered: 2,
  claimed: 2
};

// US-112 AC2/AC4: every reached step with its saved date. A lot marked paid
// before US-108 has status `paid` and no `paid_at`, so it returns the step with
// `date: null` and the page prints the label alone.
export function soldLotStepDates(lot: {
  status: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}): SoldLotStepDate[] {
  const reached = STEP_INDEX[lot.status];
  if (reached === undefined) return [];

  return [
    { key: 'paid' as const, label: 'Dibayar', date: lot.paid_at },
    { key: 'shipped' as const, label: 'Dikirim', date: lot.shipped_at },
    { key: 'delivered' as const, label: 'Diterima', date: lot.delivered_at }
  ].slice(0, reached + 1);
}

// US-110 AC5 (D-078): the farmer's payout state on a sold lot. Null while the
// lot is `won`, because the winner has not paid yet.
export type SoldLotPayout = {
  status: 'pending' | 'due' | 'paid' | 'cancelled';
  gross_amount: number;
  bank_fee: number | null;
  net_amount: number | null;
  paid_at: string | null;
};

// One line per state, with the money broken down only once it was transferred.
// The gross is the final price; the net is gross minus the admin-typed bank fee.
export function soldLotPayoutLabel(payout: SoldLotPayout | null): string | null {
  if (!payout) return null;

  switch (payout.status) {
    case 'pending':
      return 'Dana menunggu koi diterima';
    case 'due':
      return 'Dana siap ditransfer admin';
    case 'cancelled':
      return 'Dana dikembalikan ke pemenang; lot ini tidak dibayar';
    case 'paid': {
      const when = payout.paid_at ? ` ${formatDeadline(payout.paid_at)} WIB` : '';
      const gross = formatPrice(payout.gross_amount);
      if (payout.bank_fee === null || payout.net_amount === null) {
        return `Dana ditransfer${when}: ${gross}`;
      }
      const fee = formatPrice(payout.bank_fee);
      const net = formatPrice(payout.net_amount);
      return `Dana ditransfer${when}: ${gross} − biaya transfer ${fee} = ${net}`;
    }
    default:
      return null;
  }
}

export type MaskedAddress = { city: string | null; province: string | null };export function maskedAddressLabel(address: MaskedAddress | null): string {
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
