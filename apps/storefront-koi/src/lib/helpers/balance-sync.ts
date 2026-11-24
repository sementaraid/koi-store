/**
 * The header chip is read by the layout, which a client navigation inside one
 * route group does not re-render. A page that shows the balance itself compares
 * the two numbers; a mismatch means the chip is stale (an admin changed the
 * balance since the layout rendered). Either side missing means one read
 * failed or the visitor is signed out, so there is nothing to compare.
 */
export function shellBalanceStale(
  shell: number | null | undefined,
  page: number | null | undefined
): boolean {
  if (shell === null || shell === undefined) return false;
  if (page === null || page === undefined) return false;
  return shell !== page;
}
