/** Where a `?redirect=` may actually send someone.

    Only a path of this site's own. An absolute URL, or a protocol-relative
    `//evil.com`, is an open redirect: a link that wears the house's domain in
    the address bar and lands the visitor somewhere else, right after they
    typed their password. A backslash counts too — browsers normalise `/\` to
    `//`. Anything that is not plainly ours falls back to the front page. */
export function safeRedirect(value: string | null | undefined, home = '/'): string {
  if (!value) return home;

  const path = value.trim();

  if (!path.startsWith('/')) return home;
  /* `//host` and `/\host` both leave the site. */
  if (path.startsWith('//') || path.startsWith('/\\')) return home;

  return path;
}
