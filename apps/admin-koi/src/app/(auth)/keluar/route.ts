import { signout } from '@/lib/data/auth';

/**
 * The way out.
 *
 * A POST route rather than a page, because signing out is a state change: as a
 * GET it would fire on a link prefetch or on anything that renders the menu's
 * href, and the operator would find themselves signed out without clicking.
 * The chrome posts a form to it.
 *
 * `signout()` clears the token cookie and ends in `redirect('/masuk')`, which
 * Next turns into the response.
 */
export async function POST() {
  await signout();
}
