export function safeRedirect(value: string | null | undefined, home = '/'): string {
  if (!value) return home;

  const path = value.trim();

  if (!path.startsWith('/')) return home;
  if (path.startsWith('//') || path.startsWith('/\\')) return home;

  return path;
}
