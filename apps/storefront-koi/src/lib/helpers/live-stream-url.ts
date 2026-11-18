/* The farmer's live link (US-046 T-046.3, D-061).

   A client-side mirror of `packages/api/src/utils/live-stream.ts`: https only,
   YouTube or Instagram after a leading `www.`/`m.`, and a non-empty path. The
   server owns the rule; this only saves a round trip. Plain `URL`, no fetch. */

const ALLOWED_HOSTS = ['youtube.com', 'youtu.be', 'instagram.com'];

/** Whether `value` is a link the server's live-link route accepts. */
export function isLiveStreamUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
  if (!ALLOWED_HOSTS.includes(host)) return false;
  return url.pathname.length > 1;
}
