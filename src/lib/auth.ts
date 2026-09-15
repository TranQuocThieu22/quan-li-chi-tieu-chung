import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export function getActivePartnership(userId: number) {
  return prisma.partnership.findFirst({
    where: { endedAt: null, OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: true,
      userB: true,
      members: { where: { userId: { not: null } }, orderBy: { id: 'asc' } },
    },
  });
}

export type ActivePartnership = NonNullable<Awaited<ReturnType<typeof getActivePartnership>>>;

export function getPartner(partnership: ActivePartnership, userId: number) {
  return partnership.userAId === userId ? partnership.userB : partnership.userA;
}

// Superadmin mặc định: luôn có quyền và không thể bị gỡ, tránh trường hợp không còn ai quản trị
export const ROOT_SUPERADMIN_EMAIL = 'quocthieu.forwork@gmail.com';

export function isSuperAdmin(user: { email: string; isSuperAdmin: boolean }) {
  return user.isSuperAdmin || user.email === ROOT_SUPERADMIN_EMAIL;
}

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// Dùng trong Route Handler dành cho superadmin
export async function requireSuperAdmin(): Promise<{ ok: true; user: CurrentUser } | { ok: false; response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 }) };
  }
  if (!isSuperAdmin(user)) {
    return { ok: false, response: NextResponse.json({ error: 'Bạn không có quyền superadmin' }, { status: 403 }) };
  }
  return { ok: true, user };
}

export function publicUser(user: { id: number; name: string; email: string; image: string | null }) {
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

// Dùng trong Server Component: chưa đăng nhập -> /login, chưa liên kết -> trang liên kết
export async function requirePartnershipPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const partnership = await getActivePartnership(user.id);
  if (!partnership) redirect('/admin');
  return { user, partnership };
}

type Context =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; partnership: ActivePartnership }
  | { ok: false; response: NextResponse };

// Dùng trong Route Handler: yêu cầu đăng nhập và đã liên kết với một tài khoản khác
export async function requirePartnership(): Promise<Context> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 }) };
  }
  const partnership = await getActivePartnership(user.id);
  if (!partnership) {
    return { ok: false, response: NextResponse.json({ error: 'Bạn chưa liên kết với tài khoản nào' }, { status: 403 }) };
  }
  return { ok: true, user, partnership };
}
