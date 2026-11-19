import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isTokenExpired,
  tokenActorId,
  tokenSecondsRemaining
} from './token.ts';

const tokenWith = (payload: object) =>
  `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(
    JSON.stringify(payload)
  ).toString('base64url')}.s`;

test('reads the actor_id out of a token', () => {
  assert.equal(tokenActorId(tokenWith({ actor_id: 'mem_123' })), 'mem_123');
});

test('treats an empty actor_id as none — the unregistered-actor case', () => {
  assert.equal(tokenActorId(tokenWith({ actor_id: '' })), null);
});

test('rejects garbage without throwing', () => {
  assert.equal(tokenActorId('not-a-jwt'), null);
  assert.equal(tokenActorId(null), null);
  assert.equal(isTokenExpired('h.malformed.s'), true);
  assert.equal(isTokenExpired('eyJ.eyJ.s'), true);
  assert.equal(isTokenExpired('no-dots'), true);
  assert.equal(isTokenExpired(''), true);
});

test('an expired token is expired', () => {
  assert.equal(isTokenExpired(tokenWith({ exp: Math.floor(Date.now() / 1000) - 1 })), true);
  assert.equal(
    isTokenExpired(tokenWith({ exp: Math.floor(Date.now() / 1000) + 3600 })),
    false
  );
});

test('a token with no exp is treated as expired, never as valid', () => {
  assert.equal(isTokenExpired(tokenWith({ actor_id: 'x' })), true);
});

test('decodes base64url payloads containing - and _', () => {
  const actor = '~~~???>>>';
  const token = tokenWith({ actor_id: actor, exp: Math.floor(Date.now() / 1000) + 60 });
  assert.match(token, /[-_]/);
  assert.equal(tokenActorId(token), actor);
});

test('remaining seconds track exp, and an expired token has none', () => {
  const now = Math.floor(Date.now() / 1000);
  assert.equal(tokenSecondsRemaining(tokenWith({ exp: now + 3600 })), 3600);
  assert.equal(tokenSecondsRemaining(tokenWith({ exp: now - 1 })), null);
  assert.equal(tokenSecondsRemaining(tokenWith({})), null);
  assert.equal(tokenSecondsRemaining(null), null);
});
