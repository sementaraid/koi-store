const JWT_PREFIX = 'eyJ';

const decodeJwt = (token: string) => {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    if (!header.startsWith(JWT_PREFIX)) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof decoded !== 'object' || decoded === null) return null;
    return decoded as Record<string, unknown>;
  } catch {
    return null;
  }
};

/** True when the token cannot be trusted to still be valid (unreadable or past `exp`). */
export const isTokenExpired = (token: string | null) => {
  if (!token) return true;

  const payload = decodeJwt(token);
  if (typeof payload?.exp !== 'number') return true;

  return payload.exp * 1000 < Date.now();
};

/** Seconds left before `exp`, or `null` when the token is unreadable or already expired. */
export const tokenSecondsRemaining = (token: string | null): number | null => {
  if (!token) return null;

  const payload = decodeJwt(token);
  if (typeof payload?.exp !== 'number') return null;

  const remaining = payload.exp - Math.floor(Date.now() / 1000);
  return remaining > 0 ? remaining : null;
};

export const tokenActorId = (token: string | null): string | null => {
  if (!token) return null;

  const payload = decodeJwt(token);
  return payload?.actor_id ? String(payload.actor_id) : null;
};
