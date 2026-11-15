import assert from 'node:assert/strict';
import { test } from 'node:test';

import { walletAdjustmentErrorMessage } from './wallet-error.ts';

test('maps the no-wallet 400 to Indonesian copy', () => {
  assert.equal(
    walletAdjustmentErrorMessage('Customer cus_1 has no wallet yet. A wallet is created...', 400),
    'Pelanggan belum punya saldo — profil belum lengkap.'
  );
});

test('maps the below-zero 400 to Indonesian copy', () => {
  assert.equal(
    walletAdjustmentErrorMessage('Adjustment would make the balance negative', 400),
    'Koreksi ditolak: saldo tidak boleh kurang dari Rp0.'
  );
});

test('passes through an unrecognized 400 verbatim', () => {
  assert.equal(walletAdjustmentErrorMessage('Something else went wrong', 400), 'Something else went wrong');
});

test('passes through a non-400 verbatim', () => {
  assert.equal(walletAdjustmentErrorMessage('has no wallet yet', 500), 'has no wallet yet');
  assert.equal(walletAdjustmentErrorMessage('has no wallet yet', undefined), 'has no wallet yet');
});
