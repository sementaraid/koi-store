// US-105 AC2 accepts three YouTube link shapes for a lot video: watch,
// youtu.be and Shorts. The gallery only needs the id for the privacy-enhanced
// embed, so anything else returns null and no video tile renders.
const ID = /^[A-Za-z0-9_-]{6,20}$/

function clean(value: string | null | undefined): string | null {
  return value && ID.test(value) ? value : null
}

export function youtubeVideoId(value: string): string | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null

  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, '')
  if (host === 'youtu.be') return clean(url.pathname.slice(1).split('/')[0])
  if (host !== 'youtube.com') return null
  if (url.pathname === '/watch') return clean(url.searchParams.get('v'))

  const shorts = url.pathname.match(/^\/shorts\/([^/]+)/)
  return shorts ? clean(shorts[1]) : null
}
