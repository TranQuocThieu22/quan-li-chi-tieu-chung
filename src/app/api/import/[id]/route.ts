import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Bỏ qua một giao dịch đang chờ, hoặc đưa một mục đã bỏ qua / không đọc được trở lại hộp chờ
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const id = parseInt((await params).id, 10);
  const { action } = await request.json().catch(() => ({}));
  if (!Number.isInteger(id) || !['dismiss', 'restore'].includes(action)) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 400 });
  }

  const { count } = await prisma.importedTransaction.updateMany({
    where: action === 'dismiss'
      ? { id, userId: user.id, status: 'PENDING' }
      // Mục không đọc được số tiền thì không đưa về chờ được (thiếu số tiền để điền sẵn)
      : { id, userId: user.id, status: { in: ['DISMISSED', 'INCOMING'] }, amount: { not: null } },
    data: action === 'dismiss'
      ? { status: 'DISMISSED', resolvedAt: new Date() }
      : { status: 'PENDING', resolvedAt: null },
  });
  if (count === 0) return NextResponse.json({ error: 'Không tìm thấy giao dịch' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
