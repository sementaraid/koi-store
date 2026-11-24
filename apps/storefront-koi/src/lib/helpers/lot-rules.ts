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

// The current MVP rules only (US-098 AC6): join fee once per auction, KB and
// next minimum, per-lot extend, no withdrawal, and direct payment to the farm.
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
            title: `Biaya ikut ${formatPrice(joinFee)}, sekali per lelang, dipotong dari saldo.`,
            // Refund copy follows the plan's cancellations section and D-034:
            // no refund on a loss or a leave, only on a farmer or admin cancel.
            detail:
              'Satu biaya untuk semua lot di lelang ini. Tidak dikembalikan jika Anda kalah atau keluar. Hanya dikembalikan jika farm atau admin membatalkan lelang.'
          }
        : {
            kind: 'join-fee',
            title: 'Ikut lelang ini tanpa biaya.',
            detail: 'Berlaku untuk semua lot di lelang ini.'
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
    title: 'Jika menang, Anda bayar langsung ke farm dalam 1×24 jam.',
    detail: 'Farm menandai lot lunas, lalu mengirim koi. Pembayaran di luar aplikasi.'
  });

  return rules;
}
