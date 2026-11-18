/* D-061: the auction's live link is an outbound link only, from the
   YouTube/Instagram allow-list. Mirrors the backend's rule
   (`packages/api/src/utils/live-stream.ts`) so the form can refuse a bad host
   before a round trip; the backend still decides. */
const ALLOWED_HOSTS = ['youtube.com', 'youtu.be', 'instagram.com'];

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
  // A bare host ("https://instagram.com/") carries no link to follow.
  return url.pathname.length > 1;
}
