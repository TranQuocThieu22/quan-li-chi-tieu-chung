import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import ImportActions from '@/components/ImportActions';
import { getActivePartnerships, getCurrentUser } from '@/lib/auth';
import { getSharedCategory, guessSharedCategory } from '@/lib/shared';

export const dynamic = 'force-dynamic';

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatTime = (date: Date) =>
  date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

// Giao dịch ngân hàng / MoMo chuyển tiếp từ điện thoại, chờ người dùng xếp vào Cá nhân hay Sổ chung
export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [pending, partnerships] = await Promise.all([
    prisma.importedTransaction.findMany({
      where: { userId: user.id, status: 'PENDING' },
      orderBy: { occurredAt: 'desc' },
    }),
    getActivePartnerships(user.id),
  ]);
  const hasPartnership = partnerships.length > 0;
  const total = pending.reduce((sum, t) => sum + (t.amount ?? 0), 0);

  return (
    <main className="container with-nav">
      <PageHeader
        title="Chờ xác nhận"
        subtitle={pending.length > 0 ? `${pending.length} giao dịch • ${formatMoney(total)}` : 'Giao dịch từ ngân hàng, MoMo'}
        backHref={hasPartnership ? '/' : '/personal'}
      />

      {pending.length === 0 ? (
        <div className="card">
          <div className="empty">
            <p>Không có giao dịch nào chờ xác nhận.</p>
            {!user.importTokenHash && (
              <Link href="/admin/import" className="btn btn-primary">Cài tự động nhập từ điện thoại</Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <ul className="expense-list">
            {pending.map(t => {
              const label = t.description ?? t.title ?? t.source;
              const category = getSharedCategory(guessSharedCategory(label));
              return (
                <li key={t.id} className="expense-item">
                  <div className="expense-row">
                    <div className="avatar emoji" aria-hidden>{category.icon}</div>
                    <div className="expense-body">
                      <div className="expense-top">
                        <div className="expense-title">{label}</div>
                        <div className="expense-amount">{formatMoney(t.amount ?? 0)}</div>
                      </div>
                      <div className="expense-meta">{t.source} • {formatTime(t.occurredAt)}</div>
                      <details className="import-raw">
                        <summary>Nội dung thông báo</summary>
                        <p>{t.title ? `${t.title} — ` : ''}{t.text}</p>
                      </details>
                      <div className="chip-actions">
                        {hasPartnership && (
                          <Link href={`/add?import=${t.id}`} className="chip-btn primary">Sổ chung</Link>
                        )}
                        <Link href={`/personal/add?import=${t.id}`} className="chip-btn primary">Cá nhân</Link>
                        <ImportActions id={t.id} action="dismiss" />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-muted text-sm text-center mt-4">
        <Link href="/admin/import" style={{ color: 'var(--primary-color)' }}>Cài đặt tự động nhập</Link>
      </p>

      <BottomNav shared={hasPartnership} />
    </main>
  );
}
