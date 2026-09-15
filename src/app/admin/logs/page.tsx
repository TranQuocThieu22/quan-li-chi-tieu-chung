import prisma from '@/lib/db';
import MonthSelector from '@/components/MonthSelector';
import { getPartner, requirePartnershipPage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { user, partnership } = await requirePartnershipPage();
  const resolvedParams = await searchParams;
  const month = resolvedParams.month || new Date().toISOString().slice(0, 7); // YYYY-MM
  
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="title" style={{ margin: 0, textAlign: 'left' }}>Nhật ký hoạt động</h1>
          <p className="subtitle" style={{ margin: 0 }}>Sổ chi tiêu với {getPartner(partnership, user.id).name}</p>
        </div>
        <MonthSelector />
      </div>

      {/* Danh sách dạng thẻ thay cho bảng để dùng tốt trên điện thoại */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {logs.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Không có hoạt động nào trong tháng này.
          </div>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {logs.map((log) => (
              <li key={log.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{log.item}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                      {formatMoney(log.amount)}
                      {log.action === 'Cập nhật' && log.oldAmount !== log.amount && ` (Cũ: ${formatMoney(log.oldAmount || 0)})`}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      {log.payerName} • {log.date.toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <span style={{
                    flexShrink: 0,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    background: log.action === 'Thêm mới' ? 'rgba(16, 185, 129, 0.1)' : log.action === 'Xóa' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: log.action === 'Thêm mới' ? 'var(--success-color)' : log.action === 'Xóa' ? 'var(--danger-color)' : 'var(--primary-color)'
                  }}>
                    {log.action}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
