import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import PageHeader from '@/components/PageHeader';
import PersonalExpenseForm from '@/components/PersonalExpenseForm';
import { getCurrentUser } from '@/lib/auth';
import { buildKnownCategories } from '@/lib/guess-category';
import { importPrefill } from '@/lib/import';

// Render theo request để ngày mặc định trong form là hôm nay, không phải ngày build
export const dynamic = 'force-dynamic';

const KNOWN_CATEGORY_LOOKBACK = 300;

export default async function AddPersonalExpense({ searchParams }: { searchParams: Promise<{ import?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [recent, prefill] = await Promise.all([
    prisma.personalExpense.findMany({
      where: { userId: user.id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: KNOWN_CATEGORY_LOOKBACK,
      select: { item: true, category: true },
    }),
    // ?import= : mở từ hộp "Chờ xác nhận"
    importPrefill(user.id, (await searchParams).import),
  ]);

  return (
    <main className="container">
      <PageHeader
        title={prefill ? 'Xác nhận chi tiêu cá nhân' : 'Thêm chi tiêu cá nhân'}
        backHref={prefill ? '/inbox' : '/personal'}
      />

      <div className="card">
        <PersonalExpenseForm knownCategories={buildKnownCategories(recent)} prefill={prefill} />
      </div>
    </main>
  );
}
