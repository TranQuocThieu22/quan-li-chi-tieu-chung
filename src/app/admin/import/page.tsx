import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import PageHeader from '@/components/PageHeader';
import ImportSetup from '@/components/ImportSetup';
import ImportActions from '@/components/ImportActions';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { label: string; badge: string }> = {
  PENDING: { label: 'Chờ xác nhận', badge: 'badge-primary' },
  ACCEPTED: { label: 'Đã ghi', badge: 'badge-success' },
  DISMISSED: { label: 'Đã bỏ qua', badge: '' },
  INCOMING: { label: 'Tiền vào', badge: '' },
  UNPARSED: { label: 'Không đọc được', badge: 'badge-danger' },
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default async function ImportSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Mọi thông báo vừa nhận, kể cả mục bị bỏ qua — để soát khi app đọc sai số tiền
  const recent = await prisma.importedTransaction.findMany({
    where: { userId: user.id },
    orderBy: { receivedAt: 'desc' },
    take: 20,
  });

  return (
    <div>
      <PageHeader
        title="Tự động nhập"
        subtitle={<>Giao dịch ngân hàng, MoMo tự vào <Link href="/inbox" style={{ color: 'var(--primary-color)' }}>Chờ xác nhận</Link></>}
      />

      <ImportSetup enabled={Boolean(user.importTokenHash)} />

      <section className="card">
        <div className="card-title">Thông báo nhận gần đây</div>
        {recent.length === 0 ? (
          <p className="text-muted text-sm">Chưa nhận được thông báo nào.</p>
        ) : (
          <ul className="row-list">
            {recent.map(t => {
              const status = STATUS[t.status] ?? { label: t.status, badge: '' };
              return (
                <li key={t.id} className="row" style={{ alignItems: 'flex-start' }}>
                  <div className="row-label" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong>{t.source}</strong>
                      <span className={`badge ${status.badge}`}>{status.label}</span>
                    </div>
                    <p className="expense-note" style={{ fontStyle: 'normal' }}>{t.title ? `${t.title} — ` : ''}{t.text}</p>
                    <div className="expense-meta">
                      {t.receivedAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </div>
                    {['DISMISSED', 'INCOMING'].includes(t.status) && t.amount && (
                      <div className="chip-actions"><ImportActions id={t.id} action="restore" /></div>
                    )}
                  </div>
                  <span className="row-value">{t.amount ? formatMoney(t.amount) : '—'}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
