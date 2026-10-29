import PageHeader from '@/components/PageHeader';
import SharedExpenseForm from '@/components/SharedExpenseForm';
import { getPartner, requirePartnershipPage } from '@/lib/auth';

// Render theo request để ngày mặc định trong form là hôm nay, không phải ngày build
export const dynamic = 'force-dynamic';

export default async function AddExpense() {
  // Chưa liên kết thì chuyển sang sổ cá nhân (có lời nhắc liên kết)
  const { user, partnership } = await requirePartnershipPage();

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
        />
      </div>
    </main>
  );
}
