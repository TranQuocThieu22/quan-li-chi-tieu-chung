import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePartnership } from '@/lib/auth';

// Đặt ngân sách tháng cho một sổ chung (áp dụng các tháng sau cho đến khi đổi); amount = 0 để tắt
export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const ctx = await requirePartnership(body?.partnershipId);
  if (!ctx.ok) return ctx.response;

  const month = typeof body?.month === 'string' ? body.month : '';
  const amount = Number(body?.amount);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: 'Tháng không hợp lệ' }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount < 0) {
    return NextResponse.json({ error: 'Ngân sách không hợp lệ' }, { status: 400 });
  }

  const partnershipId = ctx.partnership.id;
  const budget = await prisma.sharedBudget.upsert({
    where: { partnershipId_month: { partnershipId, month } },
    update: { amount },
    create: { partnershipId, month, amount },
  });
  return NextResponse.json(budget);
}
