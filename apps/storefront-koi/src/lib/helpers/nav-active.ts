/**
 * Which nav item owns the current path. An exact match wins, otherwise the
 * longest matching prefix does, so `/akun/bid` highlights Bid Saya rather than
 * its parent Akun. The root only ever matches itself.
 *
 * `aliases` lets an item also own other sections, for a header link whose
 * pages live under another URL (`/kategori` and `/produk` belong to Katalog).
 * An alias never decides between items: it counts as the item's own prefix.
 */
export function activeNavHref(
  pathname: string,
  hrefs: readonly string[],
  aliases: Readonly<Record<string, readonly string[]>> = {}
): string | undefined {
  const path = pathname.split(/[?#]/)[0] || "/";

  let best: string | undefined;
  let bestLength = -1;

  for (const href of hrefs) {
    for (const prefix of [href, ...(aliases[href] ?? [])]) {
      const matches =
        prefix === "/"
          ? path === "/"
          : path === prefix || path.startsWith(`${prefix}/`);

      if (matches && prefix.length > bestLength) {
        best = href;
        bestLength = prefix.length;
      }
    }
  }

  return best;
}
