import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatPrice } from './format-price.ts';
import {
  DEFAULT_EXTEND_WINDOW_MINUTES,
  lotRules,
  type LotRule,
  type LotRuleKind
} from './lot-rules.ts';

const rule = (rules: LotRule[], kind: LotRuleKind) => {
  const found = rules.find((item) => item.kind === kind);
  assert.ok(found, `expected a ${kind} rule`);
  return found;
};

const fullText = (rules: LotRule[]) =>
  rules.map((item) => `${item.title} ${item.detail ?? ''}`).join(' ');

test('the join fee comes from the auction and covers every lot in it', () => {
  const fee = rule(lotRules({ joinFee: 100_000 }), 'join-fee');

  assert.match(fee.title, new RegExp(formatPrice(100_000).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(fee.title, /sekali per lelang/);
  assert.match(fee.title, /dipotong dari saldo/);
  assert.match(fee.detail ?? '', /semua lot di lelang ini/);
  assert.match(fee.detail ?? '', /Tidak dikembalikan jika Anda kalah atau keluar/);
  assert.match(
    fee.detail ?? '',
    /Hanya dikembalikan jika farm atau admin membatalkan lelang\.$/
  );
});

test('a zero join fee reads as free, never as Rp 0', () => {
  const fee = rule(lotRules({ joinFee: 0 }), 'join-fee');

  assert.match(fee.title, /tanpa biaya/);
  assert.doesNotMatch(fullText([fee]), /Rp\s?0/);
});

test('the bid step rule shows the next minimum and KB together', () => {
  const bid = rule(lotRules({ bidStep: 50_000, nextMinimum: 2_550_000 }), 'bid-step');

  assert.equal(bid.title, `Bid berikutnya minimal ${formatPrice(2_550_000)}.`);
  assert.equal(bid.detail, `Kelipatan bid (KB) ${formatPrice(50_000)}.`);
});

test('a closed lot only states KB, since it has no next minimum', () => {
  const bid = rule(lotRules({ bidStep: 50_000 }), 'bid-step');

  assert.equal(bid.title, `Kelipatan bid (KB) ${formatPrice(50_000)}.`);
  assert.equal(bid.detail, undefined);
});

test('the extend rule uses the auction window and defaults to five minutes', () => {
  assert.equal(DEFAULT_EXTEND_WINDOW_MINUTES, 5);

  const fallback = rule(lotRules({}), 'extend');
  assert.match(fallback.title, /Bid di 5 menit terakhir/);
  assert.match(fallback.title, /5 menit\.$/);
  assert.match(fallback.detail ?? '', /Lot lain di lelang ini tidak ikut diperpanjang/);

  const live = rule(lotRules({ extendWindowMinutes: 10 }), 'extend');
  assert.match(live.title, /Bid di 10 menit terakhir/);
  assert.match(live.title, /10 menit\.$/);
});

test('bids cannot be withdrawn, and payment goes straight to the farm', () => {
  const rules = lotRules({});
  const withdraw = rule(rules, 'withdraw');
  const payment = rule(rules, 'payment');

  assert.equal(withdraw.title, 'Bid tidak bisa ditarik kembali.');
  assert.match(payment.title, /langsung ke farm/);
  assert.match(payment.title, /1×24 jam/);
  assert.match(payment.detail ?? '', /menandai lot lunas, lalu mengirim/);
});

test('the summary never carries the retired rules (US-098 AC6)', () => {
  const text = fullText(
    lotRules({ joinFee: 100_000, bidStep: 50_000, nextMinimum: 2_550_000, extendWindowMinutes: 5 })
  );

  // "dikembalikan" is allowed: the join fee is refunded when the auction is
  // cancelled. Held-balance and pay-back wording is still banned.
  for (const retired of [
    /ditahan/i,
    /rekber/i,
    /otomatis/i,
    /2 menit/i,
    /per lot/i,
    /saldo kembali/i,
    /dana kembali/i
  ]) {
    assert.doesNotMatch(text, retired);
  }
});
