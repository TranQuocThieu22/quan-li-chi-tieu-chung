import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireExpenseAccess } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireExpenseAccess(parseInt((await params).id, 10));
  if (!ctx.ok) return ctx.response;
  const { expense: existing, partnership } = ctx;

  try {
    const { item, amount, payerId, beneficiaryId, notes, imageUrl, date } = await request.json();

    // Người trả / người được mua giùm phải thuộc sổ của khoản chi này
    const memberIds = partnership.members.map(m => m.id);
    const payer = parseInt(payerId, 10);
    const beneficiary = beneficiaryId ? parseInt(beneficiaryId, 10) : null;
    if (!memberIds.includes(payer) || (beneficiary !== null && !memberIds.includes(beneficiary))) {
      return NextResponse.json({ error: 'Invalid member' }, { status: 400 });
    }

    // Create history record
    await prisma.expenseHistory.create({
      data: {
        expenseId: existing.id,
        action: 'UPDATE',
        oldItem: existing.item,
        oldAmount: existing.amount,
        oldPayerName: existing.payer.name,
        oldBeneficiaryName: existing.beneficiary?.name,
        oldDate: existing.date,
        oldNotes: existing.notes,
        oldImageUrl: existing.imageUrl
      }
    });

    const updated = await prisma.expense.update({
      where: { id: existing.id },
      data: {
        item,
        amount: parseInt(amount, 10),
        payerId: payer,
        beneficiaryId: beneficiary,
        notes,
        imageUrl,
        date: date ? new Date(date) : new Date(),
      }
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireExpenseAccess(parseInt((await params).id, 10));
  if (!ctx.ok) return ctx.response;
  const { expense: existing } = ctx;

  try {
    // Soft delete & history
    await prisma.$transaction([
      prisma.expenseHistory.create({
        data: {
          expenseId: existing.id,
          action: 'DELETE',
          oldItem: existing.item,
          oldAmount: existing.amount,
          oldPayerName: existing.payer.name,
          oldBeneficiaryName: existing.beneficiary?.name,
          oldDate: existing.date,
          oldNotes: existing.notes,
          oldImageUrl: existing.imageUrl
        }
      }),
      prisma.expense.update({
        where: { id: existing.id },
        data: { isDeleted: true }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireExpenseAccess(parseInt((await params).id, 10));
  if (!ctx.ok) return ctx.response;
  return NextResponse.json(ctx.expense);
}
