/**
 * Which nav item owns the current path. An exact match wins, otherwise the
 * longest matching prefix does, so `/akun/bid` highlights Bid Saya rather than
 * its parent Akun. The root only ever matches itself.
 */
export function activeNavHref(
  pathname: string,
  hrefs: readonly string[]
): string | undefined {
  const path = pathname.split(/[?#]/)[0] || "/";

  let best: string | undefined;

  for (const href of hrefs) {
    const matches =
      href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

    if (matches && (!best || href.length > best.length)) best = href;
  }

  return best;
}
