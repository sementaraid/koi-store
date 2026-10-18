import { signout } from '@/lib/data/customer';

/**
 * The way out.
 *
 * A POST route rather than a page, because signing out is a state change: as a
 * GET it would fire on a link prefetch, on a crawler, or on anything that
 * renders the menu's href — and the visitor would find themselves signed out
 * without having clicked. The account menu posts a form to it.
 *
 * `signout()` clears the token and the cart cookie, revalidates both tags, and
 * ends in `redirect("/")`, which Next turns into the response.
 */
export async function POST() {
  await signout();
}
