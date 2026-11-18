import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isLiveStreamUrl } from './live-stream-url.ts';

test('accepts YouTube watch and short links', () => {
  assert.equal(isLiveStreamUrl('https://www.youtube.com/watch?v=abc123'), true);
  assert.equal(isLiveStreamUrl('https://youtu.be/abc123'), true);
  assert.equal(isLiveStreamUrl('https://m.youtube.com/live/abc'), true);
});

test('accepts an Instagram live link', () => {
  assert.equal(isLiveStreamUrl('https://www.instagram.com/live/abc/'), true);
});

test('rejects a non-https link', () => {
  assert.equal(isLiveStreamUrl('http://www.youtube.com/watch?v=abc'), false);
});

test('rejects another host', () => {
  assert.equal(isLiveStreamUrl('https://vimeo.com/live/abc'), false);
});

test('rejects a look-alike host', () => {
  assert.equal(isLiveStreamUrl('https://youtube.com.evil.dev/watch?v=abc'), false);
});

test('rejects empty and bare-host values', () => {
  assert.equal(isLiveStreamUrl(''), false);
  assert.equal(isLiveStreamUrl('https://www.instagram.com/'), false);
});
