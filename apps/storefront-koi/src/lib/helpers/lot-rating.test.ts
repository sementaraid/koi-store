import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canRateLot, ratingFailureInfo, type LotRating } from './lot-rating.ts';

const rating: LotRating = {
  id: 'frat_1',
  stars: 4,
  comment: 'Pengemasan rapi.',
  created_at: '2026-11-18T08:00:00.000Z'
};

test('a shipped-or-later lot with no rating offers the form', () => {
  for (const status of ['shipped', 'delivered', 'claimed']) {
    assert.deepEqual(canRateLot({ status, rating: null }), { show: true });
  }
});

test('won, paid and anything else never offer the form', () => {
  for (const status of ['won', 'paid', 'open', 'unsold', 'cancelled']) {
    assert.deepEqual(canRateLot({ status, rating: null }), { show: false });
  }
});

test('a rated lot hides the form even when it is delivered', () => {
  assert.deepEqual(canRateLot({ status: 'delivered', rating }), { show: false });
});

test('any 409 says the row changed and refreshes, ignoring the rewritten body', () => {
  // Medusa rewrites every 409 to this body, so the code must not be branched on.
  const rewritten = {
    status: 409,
    code: 'invalid_state_error',
    message: 'The request conflicted with another request.'
  };
  assert.deepEqual(ratingFailureInfo(rewritten), {
    message: 'Status lot sudah berubah. Halaman diperbarui.',
    refresh: true
  });
  assert.deepEqual(ratingFailureInfo({ status: 409, message: 'rewritten' }), {
    message: 'Status lot sudah berubah. Halaman diperbarui.',
    refresh: true
  });
});

test('a 404 is not the winner any more, and refreshes', () => {
  assert.deepEqual(ratingFailureInfo({ status: 404, message: 'Lot tidak ditemukan.' }), {
    message: 'Lot ini tidak ditemukan.',
    refresh: true
  });
});

test('any other refusal shows the server message, or the fallback', () => {
  assert.deepEqual(ratingFailureInfo({ status: 500, message: 'Server sedang sibuk.' }), {
    message: 'Server sedang sibuk.',
    refresh: false
  });
  assert.deepEqual(ratingFailureInfo({ status: 500, message: '' }), {
    message: 'Gagal mengirim penilaian. Coba lagi.',
    refresh: false
  });
});
