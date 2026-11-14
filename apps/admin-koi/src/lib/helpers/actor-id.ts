/**
 * The `actor_id` inside a Medusa auth token, or `null` when there is none.
 *
 * @remarks
 * Read, not verified — the server signed the token and re-checks it on every
 * call, so a forged one buys nothing here. This only tells "registered for the
 * actor type it was issued for" from not: Medusa issues a token with an empty
 * `actor_id` when an auth identity exists but carries no id for that actor,
 * which is exactly a customer trying the back office door.
 *
 * Lives apart from `data/auth.ts` because that file is `'use server'`, where
 * every export has to be an async action — a sync helper there is a build error,
 * and an `async` one would be a needless POST endpoint.
 */
export function actorIdOf(token: string | null | undefined): string | null {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    /* `?? null`, not `|| null`: both answer null for the empty-string case that
       matters, and the nullish form does not also swallow a legitimate `0`-ish
       id if the shape ever changes. The empty string is handled on its own. */
    return decoded?.actor_id ? String(decoded.actor_id) : null;
  } catch {
    return null;
  }
}
