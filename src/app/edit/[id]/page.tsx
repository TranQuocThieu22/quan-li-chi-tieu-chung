import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/db';
import PageHeader from '@/components/PageHeader';
import SharedExpenseForm from '@/components/SharedExpenseForm';
import { getActivePartnerships, getCurrentUser } from '@/lib/auth';
import { parseImages } from '@/lib/shared';

export const dynamic = 'force-dynamic';

export default async function EditExpense({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Khoản chi thuộc bất kỳ sổ nào người dùng đang liên kết, không phụ thuộc sổ đang chọn
  const id = parseInt((await params).id, 10);
  const partnerships = await getActivePartnerships(user.id);
  const expense = Number.isInteger(id)
    ? await prisma.expense.findFirst({
        where: { id, isDeleted: false, partnershipId: { in: partnerships.map(p => p.id) } },
      })
    : null;
  const partnership = partnerships.find(p => p.id === expense?.partnershipId);
  if (!expense || !partnership) notFound();

  return (
    <main className="container">
      <PageHeader title="Sửa khoản chi" backHref="/" />

      <div className="card">
        <SharedExpenseForm
          partnershipId={partnership.id}
          members={partnership.members.map(m => ({ id: m.id, name: m.name, isMe: m.userId === user.id }))}
          expenseId={expense.id}
          initial={{
            item: expense.item,
            amount: expense.amount,
            category: expense.category,
            payerId: expense.payerId,
            isPayOnBehalf: expense.beneficiaryId !== null,
            date: expense.date.toISOString().split('T')[0],
            notes: expense.notes ?? '',
            images: parseImages(expense.imageUrl),
          }}
        />
      </div>
    </main>
  );
}
