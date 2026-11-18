import { NextRequest, NextResponse } from 'next/server';

import { ROUTES } from './const/routes';
import { isTokenExpired } from './lib/helpers/token';

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
