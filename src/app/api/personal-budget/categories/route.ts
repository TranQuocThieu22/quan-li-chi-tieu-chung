import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { PERSONAL_CATEGORIES } from '@/lib/personal';

// Đặt ngân sách theo danh mục cho một tháng (áp dụng các tháng sau cho đến khi đổi): { month, budgets: { food: 3000000, … } }.
// 0 để tắt danh mục đó; danh mục không gửi thì giữ nguyên.
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const month = typeof body?.month === 'string' ? body.month : '';
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: 'Tháng không hợp lệ' }, { status: 400 });
  }

  const entries = Object.entries((body?.budgets ?? {}) as Record<string, unknown>);
  const budgets: { category: string; amount: number }[] = [];
  for (const [category, value] of entries) {
    const amount = Number(value);
    if (!PERSONAL_CATEGORIES.some(c => c.key === category) || !Number.isInteger(amount) || amount < 0) {
      return NextResponse.json({ error: 'Ngân sách không hợp lệ' }, { status: 400 });
    }
    budgets.push({ category, amount });
  }

  await prisma.$transaction(
    budgets.map(({ category, amount }) =>
      prisma.personalCategoryBudget.upsert({
        where: { userId_category_month: { userId: user.id, category, month } },
        update: { amount },
        create: { userId: user.id, category, month, amount },
      }),
    ),
  );
  return NextResponse.json({ ok: true });
}
