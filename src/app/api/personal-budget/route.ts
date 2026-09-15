import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Đặt ngân sách cho một tháng (áp dụng cho các tháng sau cho đến khi đổi); amount = 0 để tắt
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const month = typeof body?.month === 'string' ? body.month : '';
  const amount = Number(body?.amount);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: 'Tháng không hợp lệ' }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount < 0) {
    return NextResponse.json({ error: 'Ngân sách không hợp lệ' }, { status: 400 });
  }

  const budget = await prisma.personalBudget.upsert({
    where: { userId_month: { userId: user.id, month } },
    update: { amount },
    create: { userId: user.id, month, amount },
  });
  return NextResponse.json(budget);
}
