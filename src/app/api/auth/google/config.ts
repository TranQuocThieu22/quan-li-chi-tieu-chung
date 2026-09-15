export const OAUTH_COOKIE = 'oauth_google';

// APP_URL dùng khi chạy sau reverse proxy làm sai lệch origin của request
export function getGoogleRedirectUri(request: Request) {
  const origin = process.env.APP_URL?.replace(/\/$/, '') ?? new URL(request.url).origin;
  return `${origin}/api/auth/google/callback`;
}
