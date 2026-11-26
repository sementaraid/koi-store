import { formatPrice } from './format-price.ts';

// US-096 AC3: every extend line uses the auction's own window; this is the
// fallback only when a fixture or an older payload has no value.
export const DEFAULT_EXTEND_WINDOW_MINUTES = 5;

export type LotRuleKind = 'join-fee' | 'bid-step' | 'extend' | 'withdraw' | 'payment';

export type LotRule = {
  kind: LotRuleKind;
  title: string;
  detail?: string;
};

export type LotRulesInput = {
  joinFee?: number;
  bidStep?: number;
  nextMinimum?: number;
  extendWindowMinutes?: number;
};

// The current MVP rules only (US-098 AC6): the per-lot join fee (US-111 AC6,
// D-070), KB and next minimum, per-lot extend, no withdrawal, and payment to
// the company account (D-068: the winner transfers, an admin confirms).
export function lotRules({
  joinFee,
  bidStep,
  nextMinimum,
  extendWindowMinutes
}: LotRulesInput): LotRule[] {
  const rules: LotRule[] = [];

  if (joinFee !== undefined) {
    rules.push(
      joinFee > 0
        ? {
            kind: 'join-fee',
            title: `Biaya ikut ${formatPrice(joinFee)}, dipotong dari saldo.`,
            // Refund copy follows the plan's cancellations section, D-034 and
            // D-076: no refund on a loss or a leave, only on a farmer, auction
            // or single-lot admin cancel.
            detail:
              'Berlaku untuk lot ini saja. Tidak dikembalikan jika Anda kalah atau keluar. Hanya dikembalikan jika farm atau admin membatalkan lelang atau lot ini.'
          }
        : {
            kind: 'join-fee',
            title: 'Ikut lot ini tanpa biaya.',
            detail: 'Berlaku untuk lot ini saja.'
          }
    );
  }

  if (bidStep !== undefined) {
    rules.push({
      kind: 'bid-step',
      title:
        nextMinimum !== undefined
          ? `Bid berikutnya minimal ${formatPrice(nextMinimum)}.`
          : `Kelipatan bid (KB) ${formatPrice(bidStep)}.`,
      ...(nextMinimum !== undefined
        ? { detail: `Kelipatan bid (KB) ${formatPrice(bidStep)}.` }
        : {})
    });
  }

  const window = extendWindowMinutes ?? DEFAULT_EXTEND_WINDOW_MINUTES;
  rules.push({
    kind: 'extend',
    title: `Bid di ${window} menit terakhir memperpanjang lot ini ${window} menit.`,
    detail: 'Lot lain di lelang ini tidak ikut diperpanjang.'
  });

  rules.push({
    kind: 'withdraw',
    title: 'Bid tidak bisa ditarik kembali.',
    detail: 'Setelah terkirim, bid tetap berlaku sampai lot ditutup.'
  });

  rules.push({
    kind: 'payment',
    title: 'Jika menang, Anda transfer harga menang ke rekening Koi Auction House dalam 1×24 jam.',
    detail: 'Admin memverifikasi transfer, lalu lot ditandai lunas dan farm mengirim koi.'
  });

  return rules;
}
