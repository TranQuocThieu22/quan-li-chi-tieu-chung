import prisma from '@/lib/db';
import PageHeader from '@/components/PageHeader';
import SharedExpenseForm from '@/components/SharedExpenseForm';
import { getPartner, requirePartnershipPage } from '@/lib/auth';
import { normalizeItemName } from '@/lib/shared';

// Render theo request để ngày mặc định trong form là hôm nay, không phải ngày build
export const dynamic = 'force-dynamic';

// Đủ để nhớ các món hay mua lại; khoản cũ hơn ít khi còn là gợi ý đúng
const KNOWN_CATEGORY_LOOKBACK = 300;

export default async function AddExpense() {
  // Chưa liên kết thì chuyển sang sổ cá nhân (có lời nhắc liên kết)
  const { user, partnership } = await requirePartnershipPage();

  // Danh mục của khoản gần nhất cùng tên; bỏ "Khác" vì đó là mặc định của khoản cũ trước khi có danh mục
  const recent = await prisma.expense.findMany({
    where: { partnershipId: partnership.id, isDeleted: false, category: { not: 'other' } },
    orderBy: { createdAt: 'desc' },
    take: KNOWN_CATEGORY_LOOKBACK,
    select: { item: true, category: true },
  });
  const knownCategories: Record<string, string> = {};
  for (const e of recent) {
    const key = normalizeItemName(e.item);
    if (key && !(key in knownCategories)) knownCategories[key] = e.category;
  }

  return (
    <main className="container">
      <PageHeader
        title="Thêm khoản chi"
        subtitle={`Sổ chung với ${getPartner(partnership, user.id).name}`}
        backHref="/"
      />

      <div className="card">
        <SharedExpenseForm
          partnershipId={partnership.id}
          members={partnership.members.map(m => ({ id: m.id, name: m.name, isMe: m.userId === user.id }))}
          knownCategories={knownCategories}
        />
      </div>
    </main>
  );
}
