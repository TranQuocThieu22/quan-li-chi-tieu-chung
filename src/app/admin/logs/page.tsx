import prisma from '@/lib/db';
import MonthSelector from '@/components/MonthSelector';
import PageHeader from '@/components/PageHeader';
import { getPartner, requirePartnershipPage } from '@/lib/auth';
import { vietnamToday } from '@/lib/budget';

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { user, partnership } = await requirePartnershipPage();
  const resolvedParams = await searchParams;
  const month = resolvedParams.month || vietnamToday().month; // YYYY-MM, theo giờ Việt Nam
  
  const [year, monthStr] = month.split('-');
  const start = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
  const end = new Date(parseInt(year), parseInt(monthStr), 1);

  const expenses = await prisma.expense.findMany({
    where: { partnershipId: partnership.id, createdAt: { gte: start, lt: end } },
    include: { payer: true }
  });

  const histories = await prisma.expenseHistory.findMany({
    where: { expense: { partnershipId: partnership.id }, editedAt: { gte: start, lt: end } },
    include: { expense: { include: { payer: true } } }
  });

  type LogItem = {
    id: string;
    date: Date;
    action: 'Thêm mới' | 'Cập nhật' | 'Xóa' | 'Đánh dấu đã trả' | 'Bỏ đánh dấu đã trả';
    item: string;
    amount: number;
    payerName: string;
    expenseDate: Date;
    oldAmount?: number;
    oldItem?: string;
  };

  const logs: LogItem[] = [];

  expenses.forEach(e => {
    logs.push({
      id: `add-${e.id}`,
      date: e.createdAt,
      action: 'Thêm mới',
      item: e.item,
      amount: e.amount,
      payerName: e.payer?.name || 'Không rõ',
      expenseDate: e.date
    });
  });

  histories.forEach(h => {
    logs.push({
      id: `hist-${h.id}`,
      date: h.editedAt,
      action: h.action === 'DELETE' ? 'Xóa'
        : h.action === 'SETTLE' ? 'Đánh dấu đã trả'
        : h.action === 'UNSETTLE' ? 'Bỏ đánh dấu đã trả'
        : 'Cập nhật',
      item: h.action === 'DELETE' ? h.oldItem : (h.expense?.item || h.oldItem),
      amount: h.action === 'DELETE' ? h.oldAmount : (h.expense?.amount || h.oldAmount),
      payerName: h.expense?.payer?.name || h.oldPayerName,
      expenseDate: h.expense?.date || h.oldDate,
      oldAmount: h.oldAmount,
      oldItem: h.oldItem
    });
  });

  logs.sort((a, b) => b.date.getTime() - a.date.getTime());

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const badgeClass = (action: LogItem['action']) =>
    action === 'Thêm mới' ? 'badge-success' : action === 'Xóa' ? 'badge-danger' : 'badge-primary';

  return (
    <div>
      <PageHeader title="Nhật ký hoạt động" subtitle={`Sổ chung với ${getPartner(partnership, user.id).name}`} />
      <MonthSelector />

      {/* Danh sách dạng thẻ thay cho bảng để dùng tốt trên điện thoại */}
      <div className="card flush">
        {logs.length === 0 ? (
          <p className="empty">Không có hoạt động nào trong tháng này.</p>
        ) : (
          <ul className="list">
            {logs.map((log) => (
              <li key={log.id} className="list-item">
                <div className="expense-top">
                  <div className="expense-title">{log.item}</div>
                  <span className={`badge ${badgeClass(log.action)}`}>{log.action}</span>
                </div>
                <div className="expense-meta">
                  <span className="num" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatMoney(log.amount)}</span>
                  {log.action === 'Cập nhật' && log.oldAmount !== log.amount && ` (cũ: ${formatMoney(log.oldAmount || 0)})`}
                </div>
                <div className="expense-meta" style={{ fontSize: '0.75rem' }}>
                  {log.payerName} • {log.date.toLocaleString('vi-VN')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
