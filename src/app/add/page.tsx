import prisma from '@/lib/db';
import PageHeader from '@/components/PageHeader';
import SharedExpenseForm from '@/components/SharedExpenseForm';
import { getPartner, requirePartnershipPage } from '@/lib/auth';
import { buildKnownCategories } from '@/lib/guess-category';
import { importPrefill } from '@/lib/import';

// Render theo request để ngày mặc định trong form là hôm nay, không phải ngày build
export const dynamic = 'force-dynamic';

// Đủ để nhớ các món hay mua lại; khoản cũ hơn ít khi còn là gợi ý đúng
const KNOWN_CATEGORY_LOOKBACK = 300;

export default async function AddExpense({ searchParams }: { searchParams: Promise<{ import?: string }> }) {
  // Chưa liên kết thì chuyển sang sổ cá nhân (có lời nhắc liên kết)
  const { user, partnership } = await requirePartnershipPage();

  const [recent, prefill] = await Promise.all([
    prisma.expense.findMany({
      where: { partnershipId: partnership.id, isDeleted: false },
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
        title={prefill ? 'Xác nhận vào sổ chung' : 'Thêm khoản chi'}
        subtitle={`Sổ chung với ${getPartner(partnership, user.id).name}`}
        backHref={prefill ? '/inbox' : '/'}
      />

      <div className="card">
        <SharedExpenseForm
          partnershipId={partnership.id}
          members={partnership.members.map(m => ({ id: m.id, name: m.name, isMe: m.userId === user.id }))}
          knownCategories={buildKnownCategories(recent)}
          prefill={prefill}
        />
      </div>
    </main>
  );
}
