import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import CategoryBudgetForm from '@/components/CategoryBudgetForm';
import { getActivePartnerships, getCurrentUser } from '@/lib/auth';
import { vietnamToday } from '@/lib/budget';
import { getCategoryBudgets } from '@/lib/budget-server';

export const dynamic = 'force-dynamic';

// Đặt ngân sách từng danh mục chi tiêu cá nhân cho một tháng (áp dụng các tháng sau cho đến khi đổi)
export default async function CategoryBudgetsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const requested = (await searchParams).month;
  const month = requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : vietnamToday().month;
  const [budgets, partnerships] = await Promise.all([getCategoryBudgets(user.id, month), getActivePartnerships(user.id)]);
  const [year, monthNum] = month.split('-');

  return (
    <main className="container with-nav">
      <PageHeader
        title="Ngân sách danh mục"
        subtitle={`Áp dụng từ tháng ${monthNum}/${year} cho các tháng sau`}
        backHref={`/personal?month=${month}`}
      />
      <CategoryBudgetForm
        month={month}
        initial={Object.fromEntries(Object.entries(budgets).map(([key, b]) => [key, b.amount]))}
      />
      <BottomNav shared={partnerships.length > 0} />
    </main>
  );
}
