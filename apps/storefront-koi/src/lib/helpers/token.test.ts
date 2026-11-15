import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isTokenExpired, tokenActorId } from './token.ts';

const tokenWith = (payload: object) =>
  `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;

test('reads the actor_id out of a token', () => {
  assert.equal(tokenActorId(tokenWith({ actor_id: 'mem_123' })), 'mem_123');
});

test('treats an empty actor_id as none — the unregistered-actor case', () => {
  assert.equal(tokenActorId(tokenWith({ actor_id: '' })), null);
});

test('rejects garbage without throwing', () => {
  assert.equal(tokenActorId('not-a-jwt'), null);
  assert.equal(tokenActorId(null), null);
});

test('an expired token is expired', () => {
  assert.equal(isTokenExpired(tokenWith({ exp: Math.floor(Date.now() / 1000) - 1 })), true);
  assert.equal(
    isTokenExpired(tokenWith({ exp: Math.floor(Date.now() / 1000) + 3600 })),
    false
  );
});
