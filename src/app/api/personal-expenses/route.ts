import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parsePersonalExpenseInput } from '@/lib/personal';
import { resolveImport } from '@/lib/import';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = parsePersonalExpenseInput(body);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const expense = await prisma.personalExpense.create({ data: { ...parsed.data, userId: user.id } });
    // Tạo từ thông báo ngân hàng / MoMo thì gỡ khỏi hộp chờ xác nhận
    await resolveImport(user.id, body?.importId, { personalExpenseId: expense.id });
    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Không lưu được khoản chi' }, { status: 500 });
  }
}
