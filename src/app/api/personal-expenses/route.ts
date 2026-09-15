import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parsePersonalExpenseInput } from '@/lib/personal';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const parsed = parsePersonalExpenseInput(await request.json().catch(() => null));
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const expense = await prisma.personalExpense.create({ data: { ...parsed.data, userId: user.id } });
    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Không lưu được khoản chi' }, { status: 500 });
  }
}
