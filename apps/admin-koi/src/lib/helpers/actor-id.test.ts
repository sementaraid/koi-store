import assert from 'node:assert/strict';
import { test } from 'node:test';

import { actorIdOf } from './actor-id.ts';

const tokenWith = (payload: object) =>
  `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;

test('reads the actor_id out of a real token', () => {
  assert.equal(actorIdOf(tokenWith({ actor_id: 'user_123' })), 'user_123');
});

test('treats an empty actor_id as none — the unregistered-actor case', () => {
  assert.equal(actorIdOf(tokenWith({ actor_id: '' })), null);
});

test('rejects garbage without throwing', () => {
  assert.equal(actorIdOf('not-a-jwt'), null);
  assert.equal(actorIdOf(''), null);
  assert.equal(actorIdOf(null), null);
  assert.equal(actorIdOf(undefined), null);
});
