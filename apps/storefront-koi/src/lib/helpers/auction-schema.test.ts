import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  auctionLengthError,
  canRemoveLot,
  EMPTY_LOT,
  isYouTubeVideoUrl,
  jakartaInputValue,
  jakartaIso,
  KOI_AGES,
  KOI_SEXES,
  KOI_VARIETIES,
  lotPhotosError,
  lotSchema,
  totalListingFee,
  YOUTUBE_VIDEO_ERROR
} from './auction-schema.ts';

test('auction length must be 1-7 days, end after start', () => {
  const start = '2026-12-01T10:00';
  assert.equal(auctionLengthError(start, '2026-12-02T10:00'), null);
  assert.equal(auctionLengthError(start, '2026-12-08T10:00'), null);
  assert.equal(
    auctionLengthError(start, '2026-12-01T09:00'),
    'Waktu selesai harus setelah waktu mulai.'
  );
  assert.equal(
    auctionLengthError(start, '2026-12-01T10:30'),
    'Lelang harus berlangsung 1-7 hari.'
  );
  assert.equal(
    auctionLengthError(start, '2026-12-09T10:00'),
    'Lelang harus berlangsung 1-7 hari.'
  );
});

test('auction length refuses an unparseable datetime', () => {
  assert.equal(auctionLengthError('', '2026-12-02T10:00'), 'Pilih waktu mulai dan selesai.');
});

test('the last lot cannot be removed (server refuses it with a 400)', () => {
  assert.equal(canRemoveLot(1), false);
  assert.equal(canRemoveLot(2), true);
});

test('total listing fee is per-lot fee times lot count (D-032)', () => {
  assert.equal(totalListingFee(50_000, 1), 50_000);
  assert.equal(totalListingFee(50_000, 3), 150_000);
  assert.equal(totalListingFee(100_000, 0), 0);
});

test('a Jakarta wall-clock value round-trips through the input helper', () => {
  assert.equal(jakartaInputValue('2026-11-16T06:52:00.000Z'), '2026-11-16T13:52');
  assert.equal(jakartaIso('2026-11-16T13:52'), '2026-11-16T06:52:00.000Z');
});

test('a lot needs at least one photo', () => {
  assert.equal(lotPhotosError(0), 'Unggah minimal satu foto untuk lot ini.');
  assert.equal(lotPhotosError(1), null);
  assert.equal(lotPhotosError(3), null);
});

const validLot = {
  ...EMPTY_LOT,
  title: 'Kohaku 55',
  ob: 100_000,
  kb: 10_000,
  variety: 'Kohaku' as const,
  size_cm: '55'
};

test('a lot requires variety and a whole size from 1 to 150 cm (D-081)', () => {
  assert.equal(lotSchema.safeParse(validLot).success, true);
  assert.equal(lotSchema.safeParse({ ...validLot, variety: '' }).success, false);
  assert.equal(lotSchema.safeParse({ ...validLot, size_cm: '' }).success, false);
  assert.equal(lotSchema.safeParse({ ...validLot, size_cm: '0' }).success, false);
  assert.equal(lotSchema.safeParse({ ...validLot, size_cm: '151' }).success, false);
  assert.equal(lotSchema.safeParse({ ...validLot, size_cm: '55.5' }).success, false);
  assert.equal(lotSchema.safeParse({ ...validLot, size_cm: '1' }).success, true);
  assert.equal(lotSchema.safeParse({ ...validLot, size_cm: '150' }).success, true);
});

test('a lot accepts only the D-081 variety, age and sex lists', () => {
  assert.equal(KOI_VARIETIES.includes('Lainnya'), true);
  assert.equal(KOI_AGES.length, 5);
  assert.equal(KOI_SEXES.length, 3);

  assert.equal(lotSchema.safeParse({ ...validLot, variety: 'Koi Liar' }).success, false);
  assert.equal(lotSchema.safeParse({ ...validLot, age: 'Tosai (1 tahun)' }).success, true);
  assert.equal(lotSchema.safeParse({ ...validLot, age: 'Anak' }).success, false);
  assert.equal(lotSchema.safeParse({ ...validLot, sex: 'Betina' }).success, true);
  assert.equal(lotSchema.safeParse({ ...validLot, sex: 'Lainnya' }).success, false);
});

test('breeder notes stop at 1000 characters', () => {
  assert.equal(lotSchema.safeParse({ ...validLot, breeder_notes: 'a'.repeat(1000) }).success, true);
  assert.equal(lotSchema.safeParse({ ...validLot, breeder_notes: 'a'.repeat(1001) }).success, false);
});

test('isYouTubeVideoUrl accepts watch, youtu.be and Shorts links only', () => {
  assert.equal(isYouTubeVideoUrl('https://www.youtube.com/watch?v=abc123'), true);
  assert.equal(isYouTubeVideoUrl('https://youtu.be/abc123'), true);
  assert.equal(isYouTubeVideoUrl('https://m.youtube.com/watch?v=abc'), true);
  assert.equal(isYouTubeVideoUrl('https://www.youtube.com/shorts/abc123'), true);

  assert.equal(isYouTubeVideoUrl('http://youtu.be/abc123'), false);
  assert.equal(isYouTubeVideoUrl('https://vimeo.com/123'), false);
  assert.equal(isYouTubeVideoUrl('https://www.instagram.com/reel/abc/'), false);
  assert.equal(isYouTubeVideoUrl('https://youtube.com.evil.dev/watch?v=abc'), false);
  assert.equal(isYouTubeVideoUrl('https://www.youtube.com/watch'), false);
  assert.equal(isYouTubeVideoUrl(''), false);
});

test('a lot refuses a non-YouTube video with the backend message (D-055)', () => {
  const result = lotSchema.safeParse({ ...validLot, video_url: 'https://vimeo.com/123' });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0]?.message, YOUTUBE_VIDEO_ERROR);
  }

  assert.equal(lotSchema.safeParse({ ...validLot, video_url: 'https://youtu.be/abc' }).success, true);
});
