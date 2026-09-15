import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/db';
import PersonalExpenseForm from '@/components/PersonalExpenseForm';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function EditPersonalExpense({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const id = parseInt((await params).id, 10);
  const expense = Number.isInteger(id)
    ? await prisma.personalExpense.findFirst({ where: { id, userId: user.id, isDeleted: false } })
    : null;
  if (!expense) notFound();

  return (
    <main className="container">
      <header>
        <h1 className="title" style={{marginBottom: 0}}>Sửa Chi Tiêu Cá Nhân</h1>
        <Link href={`/personal?month=${expense.date.toISOString().slice(0, 7)}`} className="btn btn-secondary" style={{width: 'auto'}}>Hủy</Link>
      </header>

      <div className="card">
        <PersonalExpenseForm
          expenseId={expense.id}
          initial={{
            item: expense.item,
            amount: expense.amount,
            category: expense.category,
            date: expense.date.toISOString().split('T')[0],
            notes: expense.notes ?? '',
          }}
        />
      </div>
    </main>
  );
}
