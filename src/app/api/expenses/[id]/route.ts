import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePartnership } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePartnership();
  if (!ctx.ok) return ctx.response;

  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    const { item, amount, payerId, beneficiaryId, notes, imageUrl, date } = await request.json();

    const existing = await prisma.expense.findFirst({
      where: { id, partnershipId: ctx.partnership.id },
      include: { payer: true, beneficiary: true }
    });

    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const memberIds = ctx.partnership.members.map(m => m.id);
    const payer = parseInt(payerId, 10);
    const beneficiary = beneficiaryId ? parseInt(beneficiaryId, 10) : null;
    if (!memberIds.includes(payer) || (beneficiary !== null && !memberIds.includes(beneficiary))) {
      return NextResponse.json({ error: 'Invalid member' }, { status: 400 });
    }

    // Create history record
    await prisma.expenseHistory.create({
      data: {
        expenseId: id,
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
      where: { id },
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePartnership();
  if (!ctx.ok) return ctx.response;

  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    const existing = await prisma.expense.findFirst({
      where: { id, partnershipId: ctx.partnership.id },
      include: { payer: true, beneficiary: true }
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
          oldBeneficiaryName: existing.beneficiary?.name,
          oldDate: existing.date,
          oldNotes: existing.notes,
          oldImageUrl: existing.imageUrl
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
  const ctx = await requirePartnership();
  if (!ctx.ok) return ctx.response;

  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    const expense = await prisma.expense.findFirst({
      where: { id, partnershipId: ctx.partnership.id },
      include: { payer: true, beneficiary: true }
    });
    if (!expense || expense.isDeleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
