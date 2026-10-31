import Link from 'next/link';
import { getBudgetAlerts, type BudgetAlert } from '@/lib/budget-server';

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const detail = (a: BudgetAlert) =>
  a.level === 'over' ? `vượt ngân sách ${formatMoney(-a.remaining)}` : `đã dùng ${a.percent}% ngân sách — còn ${formatMoney(a.remaining)}`;

// Nhắc ngân sách tháng này (từ 80%) ở đầu trang. Sổ chung mỗi sổ một dòng. Ngân sách cá nhân (tổng, từng danh mục) gộp một
// dòng và chỉ hiện ở trang Sổ chung — trang Cá nhân đã có thanh tiến độ ngay bên dưới.
export default async function BudgetAlerts({ userId, page }: { userId: number; page: 'shared' | 'personal' }) {
  const alerts = await getBudgetAlerts(userId);
  const sharedAlerts = alerts.filter(a => a.key.startsWith('shared-'));
  const personalAlerts = page === 'shared' ? alerts.filter(a => !a.key.startsWith('shared-')) : [];
  if (sharedAlerts.length === 0 && personalAlerts.length === 0) return null;

  const worst = personalAlerts.some(a => a.level === 'over') ? 'over' : 'warn';
  return (
    <>
      {sharedAlerts.map(a => (
        <Link key={a.key} href={a.href} className={`notice notice-info import-banner budget-alert ${a.level}`}>
          <span><strong>{a.label}</strong> {detail(a)}</span>
          <span className="import-banner-cta">Xem →</span>
        </Link>
      ))}
      {personalAlerts.length > 0 && (
        <Link href="/personal" className={`notice notice-info import-banner budget-alert ${worst}`}>
          <span>
            <strong>Ngân sách cá nhân:</strong>{' '}
            {personalAlerts
              .map(a => `${a.key === 'personal' ? 'Tổng' : a.label} ${a.level === 'over' ? 'vượt' : `${a.percent}%`}`)
              .join(' · ')}
          </span>
          <span className="import-banner-cta">Xem →</span>
        </Link>
      )}
    </>
  );
}
