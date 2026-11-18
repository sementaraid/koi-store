// D-061: the farmer's live link is an outbound link only, from the
// YouTube/Instagram allow-list. Nothing is embedded or fetched.
const ALLOWED_HOSTS = ["youtube.com", "youtu.be", "instagram.com"]

export const isLiveStreamUrl = (value: string): boolean => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== "https:") {
    return false
  }
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "")
  if (!ALLOWED_HOSTS.includes(host)) {
    return false
  }
  // A bare host ("https://instagram.com/") carries no link to follow.
  return url.pathname.length > 1
}
