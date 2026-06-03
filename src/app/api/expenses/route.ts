import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    
    let whereClause: any = { isDeleted: false };
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
  try {
    const { item, amount, payerId, notes, date } = await request.json();
    
    if (!item || !amount || !payerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        item,
        amount: parseInt(amount, 10),
        payerId: parseInt(payerId, 10),
        notes,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
