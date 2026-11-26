// US-105 (D-081): the koi's own fields on a lot. Fixed lists and formats are
// D-081's; the columns are nullable (lots created before this story), so the
// lists are enforced by the input validators, never by the database.

// D-081: the koi variety categories `/katalog` uses, plus `Lainnya`. Keep in
// step with CATEGORY_TREE.Koi in src/scripts/seed-koi.ts.
export const KOI_VARIETIES = [
  "Kohaku",
  "Sanke",
  "Showa",
  "Shiro Utsuri",
  "Hi Utsuri",
  "Asagi",
  "Shusui",
  "Tancho",
  "Ogon",
  "Kujaku",
  "Chagoi",
  "Goshiki",
  "Bekko",
  "Lainnya",
] as const

export const KOI_AGES = [
  "Tosai (1 tahun)",
  "Nisai (2 tahun)",
  "Sansai (3 tahun)",
  "Yonsai (4 tahun)",
  "Gosai+ (5 tahun atau lebih)",
] as const

export const KOI_SEXES = ["Jantan", "Betina", "Belum diketahui"] as const

// D-081: the issuer shown when the lot has no certificate.
export const NO_CERTIFICATE_ISSUER = "Tidak ada (koi lokal)"

// US-105 AC2 (D-071): one YouTube video, as a watch link, a youtu.be link or a
// Shorts link. Mirrors isLiveStreamUrl's strictness: https only, exact hosts
// after normalising www./m., and a non-empty video id.
export const isYouTubeVideoUrl = (value: string): boolean => {
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

  if (host === "youtu.be") {
    return url.pathname.slice(1).length > 0
  }
  if (host !== "youtube.com") {
    return false
  }
  if (url.pathname === "/watch") {
    return (url.searchParams.get("v") ?? "").trim().length > 0
  }
  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.slice("/shorts/".length).replace(/\/+$/, "").length > 0
  }
  return false
}
