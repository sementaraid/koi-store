
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
  return url.pathname.length > 1;
}
