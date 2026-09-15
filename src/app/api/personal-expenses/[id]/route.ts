import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { parsePersonalExpenseInput } from '@/lib/personal';

// Chỉ chủ tài khoản thao tác được với khoản chi cá nhân của mình
async function findOwnExpense(params: Promise<{ id: string }>) {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 }) };

  const id = parseInt((await params).id, 10);
  const expense = Number.isInteger(id)
    ? await prisma.personalExpense.findFirst({ where: { id, userId: user.id, isDeleted: false } })
    : null;
  if (!expense) return { response: NextResponse.json({ error: 'Không tìm thấy khoản chi' }, { status: 404 }) };

  return { expense };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { expense, response } = await findOwnExpense(params);
  if (!expense) return response;

  const parsed = parsePersonalExpenseInput(await request.json().catch(() => null));
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const updated = await prisma.personalExpense.update({ where: { id: expense.id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Không lưu được khoản chi' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { expense, response } = await findOwnExpense(params);
  if (!expense) return response;

  await prisma.personalExpense.update({ where: { id: expense.id }, data: { isDeleted: true } });
  return NextResponse.json({ success: true });
}
