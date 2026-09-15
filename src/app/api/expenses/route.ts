import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePartnership } from '@/lib/auth';

export async function GET(request: Request) {
  const ctx = await requirePartnership();
  if (!ctx.ok) return ctx.response;

  try {
    const { searchParams } = new URL(request.url);
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await requirePartnership();
  if (!ctx.ok) return ctx.response;

  try {
    const { item, amount, payerId, beneficiaryId, notes, imageUrl, date } = await request.json();

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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
