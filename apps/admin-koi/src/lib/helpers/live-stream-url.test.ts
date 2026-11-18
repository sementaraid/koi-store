import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isLiveStreamUrl } from './live-stream-url.ts';

test('accepts a YouTube watch link, with and without a mobile prefix', () => {
  assert.equal(isLiveStreamUrl('https://www.youtube.com/watch?v=abc'), true);
  assert.equal(isLiveStreamUrl('https://m.youtube.com/watch?v=abc'), true);
  assert.equal(isLiveStreamUrl('https://youtu.be/abc'), true);
});

test('accepts an Instagram live link', () => {
  assert.equal(isLiveStreamUrl('https://www.instagram.com/live/abc'), true);
});

test('refuses http, another host, a lookalike host and an empty value', () => {
  assert.equal(isLiveStreamUrl('http://www.youtube.com/watch?v=abc'), false);
  assert.equal(isLiveStreamUrl('https://vimeo.com/123'), false);
  assert.equal(isLiveStreamUrl('https://youtube.com.evil.dev/watch'), false);
  assert.equal(isLiveStreamUrl(''), false);
});

test('refuses a bare host with no path', () => {
  assert.equal(isLiveStreamUrl('https://www.youtube.com/'), false);
  assert.equal(isLiveStreamUrl('https://instagram.com'), false);
});
