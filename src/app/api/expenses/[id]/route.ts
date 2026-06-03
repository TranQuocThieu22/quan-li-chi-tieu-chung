import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    const { item, amount, payerId, notes, date } = await request.json();

    const existing = await prisma.expense.findUnique({
      where: { id },
      include: { payer: true }
    });

    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Create history record
    await prisma.expenseHistory.create({
      data: {
        expenseId: id,
        action: 'UPDATE',
        oldItem: existing.item,
        oldAmount: existing.amount,
        oldPayerName: existing.payer.name,
        oldDate: existing.date,
        oldNotes: existing.notes
      }
    });

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        item,
        amount: parseInt(amount, 10),
        payerId: parseInt(payerId, 10),
        notes,
        date: date ? new Date(date) : new Date(),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    const existing = await prisma.expense.findUnique({
      where: { id },
      include: { payer: true }
    });

    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Soft delete & history
    await prisma.$transaction([
      prisma.expenseHistory.create({
        data: {
          expenseId: id,
          action: 'DELETE',
          oldItem: existing.item,
          oldAmount: existing.amount,
          oldPayerName: existing.payer.name,
          oldDate: existing.date,
          oldNotes: existing.notes
        }
      }),
      prisma.expense.update({
        where: { id },
        data: { isDeleted: true }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    const expense = await prisma.expense.findUnique({ where: { id }, include: { payer: true } });
    if (!expense || expense.isDeleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
