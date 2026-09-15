import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';
import { getGoogleRedirectUri, OAUTH_COOKIE } from '../config';

type GoogleIdToken = {
  iss: string;
  aud: string;
  exp: number;
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function fail(request: NextRequest, error: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  response.cookies.delete({ name: OAUTH_COOKIE, path: '/api/auth/google' });
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const [savedState, codeVerifier] = (request.cookies.get(OAUTH_COOKIE)?.value ?? '').split('.');

  if (searchParams.get('error')) return fail(request, 'denied');
  if (!code || !state || !savedState || state !== savedState || !codeVerifier) {
    return fail(request, 'state');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail(request, 'config');

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getGoogleRedirectUri(request),
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });
    if (!tokenRes.ok) return fail(request, 'token');

    // id_token nhận trực tiếp từ Google qua HTTPS nên chỉ cần kiểm tra các claim
    const { id_token } = await tokenRes.json();
    const claims: GoogleIdToken = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64url').toString());

    const validIssuer = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com';
    if (!validIssuer || claims.aud !== clientId || claims.exp < Date.now() / 1000) {
      return fail(request, 'token');
    }
    if (!claims.email || !claims.email_verified) return fail(request, 'email');

    const email = claims.email.toLowerCase();
    const name = claims.name || email.split('@')[0];

    const user = await prisma.user.upsert({
      where: { googleId: claims.sub },
      update: { email, name, image: claims.picture },
      create: { googleId: claims.sub, email, name, image: claims.picture },
    });
    await prisma.member.updateMany({ where: { userId: user.id }, data: { name } });

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete({ name: OAUTH_COOKIE, path: '/api/auth/google' });
    response.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions);
    return response;
  } catch (error) {
    console.error('Google login failed', error);
    return fail(request, 'token');
  }
}
