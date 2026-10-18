/** The session a lot sits in, as a breadcrumb names it: the day it runs, and the
    farm running it, e.g. `"Sesi 14 Okt · Sakai Fish Farm"`.
 *
 * @remarks
 * One function rather than one per page, because a lot's page and the room it is
 * bid in are the same session — two copies would eventually name two sessions.
 * The date is read at call time and the zone is the viewer's, because "today" is
 * the viewer's question; the deadline beside a clock is Jakarta's, which is why
 * that one is formatted separately.
 */
export function sessionLabel(seller?: string, at: number = Date.now()) {
  const day = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(at)

  return seller ? `Sesi ${day} · ${seller}` : `Sesi ${day}`
}
