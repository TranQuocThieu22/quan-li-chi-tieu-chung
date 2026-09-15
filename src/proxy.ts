import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

// Kiểm tra lạc quan: chỉ xác thực chữ ký cookie. API tự kiểm tra quyền trong từng Route Handler.
export function proxy(request: NextRequest) {
  const userId = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!userId) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|login|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
