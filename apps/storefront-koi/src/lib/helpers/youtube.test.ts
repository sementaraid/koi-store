import assert from 'node:assert/strict';
import { test } from 'node:test';

import { youtubeVideoId } from './youtube.ts';

test('reads the id from a watch link', () => {
  assert.equal(youtubeVideoId('https://www.youtube.com/watch?v=abc123XYZ_'), 'abc123XYZ_');
  assert.equal(youtubeVideoId('https://m.youtube.com/watch?v=abc123XYZ_&t=30'), 'abc123XYZ_');
});

test('reads the id from a youtu.be link', () => {
  assert.equal(youtubeVideoId('https://youtu.be/abc123XYZ_'), 'abc123XYZ_');
  assert.equal(youtubeVideoId('https://youtu.be/abc123XYZ_?t=30'), 'abc123XYZ_');
});

test('reads the id from a Shorts link', () => {
  assert.equal(youtubeVideoId('https://www.youtube.com/shorts/abc123XYZ_'), 'abc123XYZ_');
});

test('rejects a non-https link', () => {
  assert.equal(youtubeVideoId('http://www.youtube.com/watch?v=abc123XYZ_'), null);
});

test('rejects another host and a look-alike host', () => {
  assert.equal(youtubeVideoId('https://vimeo.com/abc123XYZ_'), null);
  assert.equal(youtubeVideoId('https://youtube.com.evil.dev/watch?v=abc123XYZ_'), null);
});

test('rejects a YouTube path that is not watch or Shorts', () => {
  assert.equal(youtubeVideoId('https://www.youtube.com/live/abc123XYZ_'), null);
  assert.equal(youtubeVideoId('https://www.youtube.com/embed/abc123XYZ_'), null);
  assert.equal(youtubeVideoId('https://www.youtube.com/'), null);
});

test('rejects a missing or malformed id', () => {
  assert.equal(youtubeVideoId('https://www.youtube.com/watch'), null);
  assert.equal(youtubeVideoId('https://www.youtube.com/watch?v='), null);
  assert.equal(youtubeVideoId('https://youtu.be/ab'), null);
  assert.equal(youtubeVideoId(''), null);
});
