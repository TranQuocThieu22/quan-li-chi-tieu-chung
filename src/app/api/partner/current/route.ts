import { NextResponse } from 'next/server';
import { getActivePartnerships, getCurrentUser, LEDGER_COOKIE, ledgerCookieOptions } from '@/lib/auth';

// Chọn sổ chi tiêu đang xem
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { id } = await request.json().catch(() => ({}));
  const partnership = (await getActivePartnerships(user.id)).find(p => p.id === Number(id));
  if (!partnership) return NextResponse.json({ error: 'Không tìm thấy sổ chi tiêu' }, { status: 404 });

  const response = NextResponse.json({ success: true });
  response.cookies.set(LEDGER_COOKIE, String(partnership.id), ledgerCookieOptions);
  return response;
}
