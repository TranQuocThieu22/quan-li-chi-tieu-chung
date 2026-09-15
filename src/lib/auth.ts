import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

// Sổ chi tiêu đang chọn khi người dùng liên kết với nhiều người
export const LEDGER_COOKIE = 'ledger';
export const ledgerCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 365,
  path: '/',
};

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// Mỗi liên kết giữa hai người là một sổ chi tiêu riêng
export function getActivePartnerships(userId: number) {
  return prisma.partnership.findMany({
    where: { endedAt: null, OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: true,
      userB: true,
      members: { where: { userId: { not: null } }, orderBy: { id: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export type ActivePartnership = Awaited<ReturnType<typeof getActivePartnerships>>[number];

export function getPartner(partnership: ActivePartnership, userId: number) {
  return partnership.userAId === userId ? partnership.userB : partnership.userA;
}

export function toLedgerOptions(partnerships: ActivePartnership[], userId: number) {
  return partnerships.map(p => ({ id: p.id, partnerName: getPartner(p, userId).name }));
}

// Mỗi cặp chỉ có một Partnership với userAId < userBId
export function pairKey(a: number, b: number) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

function parseId(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const id = Number(value);
  return Number.isInteger(id) ? id : NaN;
}

// Ưu tiên sổ được yêu cầu; nếu không có thì lấy sổ đang chọn trong cookie, cuối cùng là sổ đầu tiên
async function pickPartnership(partnerships: ActivePartnership[], requestedId: unknown) {
  const id = parseId(requestedId);
  if (id !== null) return partnerships.find(p => p.id === id) ?? null;
  const cookieId = parseId((await cookies()).get(LEDGER_COOKIE)?.value);
  return partnerships.find(p => p.id === cookieId) ?? partnerships[0] ?? null;
}

// Superadmin mặc định: luôn có quyền và không thể bị gỡ, tránh trường hợp không còn ai quản trị
export const ROOT_SUPERADMIN_EMAIL = 'quocthieu.forwork@gmail.com';

export function isSuperAdmin(user: { email: string; isSuperAdmin: boolean }) {
  return user.isSuperAdmin || user.email === ROOT_SUPERADMIN_EMAIL;
}

export function publicUser(user: { id: number; name: string; email: string; image: string | null }) {
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

// Dùng trong Server Component: chưa đăng nhập -> /login, chưa liên kết -> sổ cá nhân (có lời nhắc liên kết)
export async function requirePartnershipPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const partnerships = await getActivePartnerships(user.id);
  const partnership = await pickPartnership(partnerships, null);
  if (!partnership) redirect('/personal');
  return { user, partnership, partnerships };
}

type Fail = { ok: false; response: NextResponse };

function fail(error: string, status: number): Fail {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

// Dùng trong Route Handler: yêu cầu đăng nhập và có quyền với sổ chi tiêu (sổ được yêu cầu hoặc sổ đang chọn)
export async function requirePartnership(
  requestedId?: unknown
): Promise<{ ok: true; user: CurrentUser; partnership: ActivePartnership } | Fail> {
  const user = await getCurrentUser();
  if (!user) return fail('Chưa đăng nhập', 401);
  const partnerships = await getActivePartnerships(user.id);
  if (partnerships.length === 0) return fail('Bạn chưa liên kết với tài khoản nào', 403);
  const partnership = await pickPartnership(partnerships, requestedId);
  if (!partnership) return fail('Bạn không có quyền với sổ chi tiêu này', 403);
  return { ok: true, user, partnership };
}

// Khoản chi thuộc bất kỳ sổ nào người dùng đang liên kết, không phụ thuộc sổ đang chọn
export async function requireExpenseAccess(expenseId: number) {
  const user = await getCurrentUser();
  if (!user) return fail('Chưa đăng nhập', 401);
  if (!Number.isInteger(expenseId)) return fail('Expense not found', 404);

  const partnerships = await getActivePartnerships(user.id);
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, isDeleted: false, partnershipId: { in: partnerships.map(p => p.id) } },
    include: { payer: true, beneficiary: true },
  });
  const partnership = partnerships.find(p => p.id === expense?.partnershipId);
  if (!expense || !partnership) return fail('Expense not found', 404);
  return { ok: true as const, user, expense, partnership };
}

// Dùng trong Route Handler dành cho superadmin
export async function requireSuperAdmin(): Promise<{ ok: true; user: CurrentUser } | Fail> {
  const user = await getCurrentUser();
  if (!user) return fail('Chưa đăng nhập', 401);
  if (!isSuperAdmin(user)) return fail('Bạn không có quyền superadmin', 403);
  return { ok: true, user };
}
