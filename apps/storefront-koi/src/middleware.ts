import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from './const/routes';
import { isTokenExpired } from './lib/helpers/token';

/**
 * Two jobs, both of which the data layer assumes someone else has done.
 *
 * 1. `_medusa_cache_id` — `getCacheTag()` in `lib/data/cookies.ts` returns `''`
 *    without it, so `getCacheOptions()` hands back no tags, every cached fetch
 *    is untagged, and the `revalidateTag()` calls in `lib/data/customer.ts`
 *    (login, signout, profile update) invalidate nothing. A signed-out visitor
 *    then keeps a `force-cache` hit of the previous session's `customers/me`
 *    while the uncached `/store/orders` call 401s — the account page renders as
 *    signed in and throws on its orders.
 *
 * 2. The account guard — `requireCustomer()` cannot be trusted alone, because
 *    it decides from that same cached `customers/me`. Checking the token at the
 *    edge keeps a stale cache from ever being the thing that lets someone in.
 *
 * `apps/storefront` does both of these in its own middleware, plus a locale and
 * region redirect this storefront has no use for — the country is a constant
 * here (`lib/region.ts`), so there is no segment to resolve.
 */

/** Paths that require a session. Prefix match, so nested pages are covered. */
const PROTECTED_ROUTES = [ROUTES.account];

const makeAuthRedirect = (
  request: NextRequest,
  reason: 'sessionRequired' | 'sessionExpired'
) => {
  const url = new URL(ROUTES.login, request.url);
  url.searchParams.set(reason, 'true');
  url.searchParams.set(
    'redirect',
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  const response = NextResponse.redirect(url);

  /* An expired token is worse than none: it survives in the jar and every
     later request pays a 401 for it. */
  if (reason === 'sessionExpired') {
    response.cookies.delete('_medusa_jwt');
  }

  return response;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('_medusa_jwt')?.value;

    if (!token) {
      return makeAuthRedirect(request, 'sessionRequired');
    }

    if (isTokenExpired(token)) {
      return makeAuthRedirect(request, 'sessionExpired');
    }
  }

  const response = NextResponse.next();

  if (!request.cookies.get('_medusa_cache_id')) {
    response.cookies.set('_medusa_cache_id', crypto.randomUUID(), {
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      path: '/'
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)'
  ]
};
