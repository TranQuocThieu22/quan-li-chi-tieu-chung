import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePartnership } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ctx = await requirePartnership(searchParams.get('partnershipId'));
  if (!ctx.ok) return ctx.response;

  try {
    const month = searchParams.get('month');

    const whereClause: { isDeleted: boolean; partnershipId: number; date?: { gte: Date; lt: Date } } = {
      isDeleted: false,
      partnershipId: ctx.partnership.id,
    };
    if (month) {
      const [year, monthStr] = month.split('-');
      const start = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
      const end = new Date(parseInt(year), parseInt(monthStr), 1);
      whereClause.date = { gte: start, lt: end };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: { payer: true, histories: { orderBy: { editedAt: 'desc' } } }
    });
    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

  // partnershipId do trang thêm khoản chi gửi lên để không phụ thuộc sổ đang chọn ở tab khác
  const ctx = await requirePartnership(body.partnershipId);
  if (!ctx.ok) return ctx.response;

  try {
    const { item, amount, payerId, beneficiaryId, notes, imageUrl, date } = body;

    if (!item || !amount || !payerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const memberIds = ctx.partnership.members.map(m => m.id);
    const payer = parseInt(payerId, 10);
    const beneficiary = beneficiaryId ? parseInt(beneficiaryId, 10) : null;
    if (!memberIds.includes(payer) || (beneficiary !== null && !memberIds.includes(beneficiary))) {
      return NextResponse.json({ error: 'Invalid member' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        item,
        amount: parseInt(amount, 10),
        payerId: payer,
        beneficiaryId: beneficiary,
        partnershipId: ctx.partnership.id,
        notes,
        imageUrl,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
