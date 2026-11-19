import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from './const/routes';
import { loginHrefFor } from './lib/helpers/login-href';
import { isTokenExpired } from './lib/helpers/token';

const AUTH_COOKIE = '_medusa_jwt';

const PROTECTED_ROUTES = [ROUTES.account];

/**
 * An expired token must never reach the API or become an identity, on any route
 * — the header renders from the same cookie, so an expired one is cleared here
 * or the header and the page disagree. The account pages keep their early
 * bounce; every other page falls through to `requireCustomer`/`getSession`.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const expired = Boolean(token) && isTokenExpired(token ?? null);

  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token || expired) {
      const url = new URL(
        loginHrefFor(
          expired ? { status: 'expired' } : { status: 'anonymous' },
          `${pathname}${request.nextUrl.search}`
        ),
        request.url
      );
      const redirect = NextResponse.redirect(url);
      if (expired) redirect.cookies.delete(AUTH_COOKIE);
      return redirect;
    }
  }

  const response = NextResponse.next();

  if (expired) {
    response.cookies.delete(AUTH_COOKIE);
  }

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
