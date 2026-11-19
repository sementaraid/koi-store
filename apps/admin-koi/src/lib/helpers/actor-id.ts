export function actorIdOf(token: string | null | undefined): string | null {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded?.actor_id ? String(decoded.actor_id) : null;
  } catch {
    return null;
  }
}
