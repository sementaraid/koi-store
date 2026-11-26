import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ARRIVAL_PROOF_IMAGE_MAX_BYTES,
  ARRIVAL_PROOF_VIDEO_MAX_BYTES,
  arrivalProofError
} from './arrival-proof.ts';

test('a photo follows the top-up rule: 5 MB, JPEG/PNG/WEBP', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.equal(arrivalProofError({ type, size: 1024 }), null);
  }
  assert.equal(
    arrivalProofError({ type: 'image/jpeg', size: ARRIVAL_PROOF_IMAGE_MAX_BYTES }),
    null
  );
  assert.match(
    arrivalProofError({ type: 'image/jpeg', size: ARRIVAL_PROOF_IMAGE_MAX_BYTES + 1 }) ?? '',
    /5 MB/
  );
});

test('a video follows the claim rule: 100 MB, MP4/WebM/QuickTime', () => {
  for (const type of ['video/mp4', 'video/webm', 'video/quicktime']) {
    assert.equal(arrivalProofError({ type, size: 1024 }), null);
  }
  assert.equal(
    arrivalProofError({ type: 'video/mp4', size: ARRIVAL_PROOF_VIDEO_MAX_BYTES }),
    null
  );
  assert.match(
    arrivalProofError({ type: 'video/mp4', size: ARRIVAL_PROOF_VIDEO_MAX_BYTES + 1 }) ?? '',
    /100 MB/
  );
});

test('another type is refused before upload', () => {
  assert.match(arrivalProofError({ type: 'application/pdf', size: 1024 }) ?? '', /JPG/);
  assert.match(arrivalProofError({ type: 'image/gif', size: 1024 }) ?? '', /video MP4/);
});

test('an empty file is not a proof', () => {
  assert.match(arrivalProofError({ type: 'image/png', size: 0 }) ?? '', /foto kosong/);
  assert.match(arrivalProofError({ type: 'video/mp4', size: 0 }) ?? '', /video kosong/);
});
