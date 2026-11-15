const decodeJwt = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    return decoded;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string | null) => {
  if (!token) return true;

  const payload = decodeJwt(token);
  if (!payload?.exp) return true;

  return payload.exp * 1000 < Date.now();
};

/**
 * The `actor_id` inside a Medusa token, or `null`.
 *
 * @remarks
 * Medusa issues a token with an empty `actor_id` when the auth identity exists
 * but carries no id for that actor type — exactly a customer signing in as a
 * member before `POST /vendor/sellers` has created their member (D-003). The
 * storefront signs in a second time after registration to get a token that has
 * one.
 *
 * Read, not verified: the server re-checks the signature on every call, so a
 * forged token buys nothing here.
 */
export const tokenActorId = (token: string | null): string | null => {
  if (!token) return null;

  const payload = decodeJwt(token);
  return payload?.actor_id ? String(payload.actor_id) : null;
};
