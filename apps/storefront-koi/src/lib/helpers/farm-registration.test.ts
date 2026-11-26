import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  farmFileError,
  farmPhotosError,
  MAX_FARM_FILE_BYTES,
  MAX_FARM_PHOTOS,
  nikError
} from './farm-registration.ts';

test('NIK must be exactly 16 digits', () => {
  assert.equal(nikError('3201234567890123'), null);
  assert.equal(nikError(' 3201234567890123 '), null);
  assert.equal(nikError('320123456789012'), 'NIK KTP terdiri dari 16 angka.');
  assert.equal(nikError('32012345678901234'), 'NIK KTP terdiri dari 16 angka.');
  assert.equal(nikError('32012345678901ab'), 'NIK KTP terdiri dari 16 angka.');
});

test('farm files must be a JPEG, PNG or WebP', () => {
  assert.equal(farmFileError({ type: 'image/jpeg', size: 1 }), null);
  assert.equal(farmFileError({ type: 'image/webp', size: 1 }), null);
  assert.equal(
    farmFileError({ type: 'image/svg+xml', size: 1 }),
    'Unggah gambar JPG, PNG, atau WEBP.'
  );
});

test('farm files must not be empty or over 5 MB', () => {
  assert.equal(farmFileError({ type: 'image/png', size: 0 }), 'File gambar kosong.');
  assert.equal(
    farmFileError({ type: 'image/png', size: MAX_FARM_FILE_BYTES + 1 }),
    'Ukuran gambar maksimal 5 MB.'
  );
});

test('one to six farm photos', () => {
  assert.equal(farmPhotosError(0), 'Unggah minimal satu foto farm.');
  assert.equal(farmPhotosError(1), null);
  assert.equal(farmPhotosError(MAX_FARM_PHOTOS), null);
  assert.equal(
    farmPhotosError(MAX_FARM_PHOTOS + 1),
    `Maksimal ${MAX_FARM_PHOTOS} foto farm.`
  );
});
