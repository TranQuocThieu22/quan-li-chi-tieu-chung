import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import RecategorizeForm from '@/components/RecategorizeForm';
import { requirePartnershipPage } from '@/lib/auth';
import { findOldUncategorized, recategorizedCookie } from '@/lib/recategorize';

export const dynamic = 'force-dynamic';

// Xếp danh mục một lượt cho các khoản chi chung tạo trước khi có danh mục (đang là "Khác")
export default async function RecategorizePage() {
  const { partnership } = await requirePartnershipPage();
  const rows = await findOldUncategorized(partnership.id);

  return (
    <main className="container with-nav">
      <PageHeader
        title="Xếp danh mục khoản cũ"
        subtitle={rows.length > 0 ? `${rows.length} khoản tạo trước khi có danh mục` : undefined}
        backHref="/"
      />

      {rows.length === 0 ? (
        <div className="card">
          <div className="empty">
            <p>Không còn khoản cũ nào ở 📦 Khác.</p>
            <Link href="/" className="btn btn-primary">Về sổ chung</Link>
          </div>
        </div>
      ) : (
        <RecategorizeForm
          doneCookie={recategorizedCookie(partnership.id)}
          rows={rows.map(e => ({
            id: e.id,
            item: e.item,
            amount: e.amount,
            date: e.date.toISOString(),
            payerName: e.payer.name,
            proposed: e.proposed,
          }))}
        />
      )}

      <BottomNav />
    </main>
  );
}
