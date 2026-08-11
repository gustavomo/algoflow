import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE_NAME,
  createAccessToken,
  isAccessBypassed,
} from './lib/access/token';

const PUBLIC_PATHS = new Set(['/', '/access', '/api/access', '/sw.js']);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname) || isAccessBypassed())
    return NextResponse.next();

  const secret = process.env.ACCESS_COOKIE_SECRET;
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const valid = secret && token === (await createAccessToken(secret));
  if (valid) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: {
          code: 'unauthorized',
          message: 'Access is required.',
          retryable: false,
        },
      },
      { status: 401 },
    );
  }

  const accessUrl = new URL('/access', request.url);
  accessUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
