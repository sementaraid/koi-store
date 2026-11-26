import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { TopupRequest } from '../data/topups.ts';
import type { WalletTransaction } from '../data/wallet.ts';
import { mergeWalletHistory } from './wallet-history.ts';

const transaction = (over: Partial<WalletTransaction>): WalletTransaction => ({
  id: 'tx_1',
  type: 'join_fee',
  amount: -100_000,
  description: null,
  reference: 'auc_123',
  created_at: '2026-11-22T09:15:00.000Z',
  ...over
});

const request = (over: Partial<TopupRequest>): TopupRequest => ({
  id: 'tr_1',
  amount: 500_000,
  status: 'pending',
  reason: null,
  has_screenshot: true,
  created_at: '2026-11-23T09:40:00.000Z',
  ...over
});

test('merges wallet and top-up rows newest first', () => {
  const rows = mergeWalletHistory(
    [transaction({ id: 'old', created_at: '2026-11-20T00:00:00.000Z' })],
    [request({ id: 'new', created_at: '2026-11-23T00:00:00.000Z' })],
    'BCA'
  );

  assert.deepEqual(
    rows.map((row) => row.id),
    ['topup-new', 'wallet-old']
  );
});

test('wallet Keterangan is the label plus the human-readable description', () => {
  const rows = mergeWalletHistory(
    [transaction({ type: 'join_fee', description: 'Kohaku 48 cm' })],
    [],
    null
  );

  assert.equal(rows[0]?.keterangan, 'Biaya ikut lelang · Kohaku 48 cm');
});

test('never falls back to the raw auction id when there is no description', () => {
  const rows = mergeWalletHistory(
    [transaction({ type: 'refund', description: null, reference: 'auc_abc123' })],
    [],
    null
  );

  assert.equal(rows[0]?.keterangan, 'Pengembalian dana');
  assert.ok(!rows[0]?.keterangan.includes('auc_abc123'));
});

test('a top-up row names the platform bank, or says Top-up saldo without one', () => {
  const withBank = mergeWalletHistory([], [request({ status: 'rejected' })], 'BCA');
  const withoutBank = mergeWalletHistory([], [request({ status: 'rejected' })], null);

  assert.equal(withBank[0]?.keterangan, 'Top-up via BCA');
  assert.equal(withoutBank[0]?.keterangan, 'Top-up saldo');
});

test('an approved request is kept out: its wallet credit already lists it', () => {
  const rows = mergeWalletHistory(
    [transaction({ id: 'credit', type: 'manual_topup', amount: 500_000, description: 'BCA 25/11' })],
    [request({ status: 'approved' })],
    'BCA'
  );

  assert.deepEqual(
    rows.map((row) => row.id),
    ['wallet-credit']
  );
});

test('an approved top-up reads Top-up via the bank, or its stored reference', () => {
  const withBank = mergeWalletHistory(
    [transaction({ type: 'manual_topup', amount: 500_000, description: 'BCA 25/11' })],
    [],
    'BCA'
  );
  assert.equal(withBank[0]?.keterangan, 'Top-up via BCA');

  const withReference = mergeWalletHistory(
    [transaction({ type: 'manual_topup', amount: 500_000, description: 'BCA 25/11' })],
    [],
    null
  );
  assert.equal(withReference[0]?.keterangan, 'Top-up via BCA 25/11');

  const withNeither = mergeWalletHistory(
    [transaction({ type: 'manual_topup', amount: 500_000, description: null })],
    [],
    null
  );
  assert.equal(withNeither[0]?.keterangan, 'Top-up saldo');
});

test('rejected rows keep the admin reason and the pending status', () => {
  const rows = mergeWalletHistory(
    [],
    [
      request({ id: 'rej', status: 'rejected', reason: 'Nominal di bukti tidak cocok.' }),
      request({ id: 'pen', status: 'pending' })
    ],
    'BCA'
  );

  const rejected = rows.find((row) => row.kind === 'topup' && row.id === 'topup-rej');
  assert.equal(rejected?.kind === 'topup' ? rejected.reason : null, 'Nominal di bukti tidak cocok.');
  assert.equal(rows.find((row) => row.id === 'topup-pen')?.kind, 'topup');
});
