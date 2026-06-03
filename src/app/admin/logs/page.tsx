import prisma from '@/lib/db';
import MonthSelector from '@/components/MonthSelector';

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const resolvedParams = await searchParams;
  const month = resolvedParams.month || new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const [year, monthStr] = month.split('-');
  const start = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
  const end = new Date(parseInt(year), parseInt(monthStr), 1);

  const expenses = await prisma.expense.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { payer: true }
  });
  
  const histories = await prisma.expenseHistory.findMany({
    where: { editedAt: { gte: start, lt: end } },
    include: { expense: { include: { payer: true } } }
  });

  type LogItem = {
    id: string;
    date: Date;
    action: 'Thêm mới' | 'Cập nhật' | 'Xóa';
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
      action: h.action === 'DELETE' ? 'Xóa' : 'Cập nhật',
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
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1 className="title" style={{ margin: 0, textAlign: 'left' }}>Nhật ký hoạt động</h1>
        <MonthSelector />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Không có hoạt động nào trong tháng này.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-color)' }}>
              <tr>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>Thời gian thực hiện</th>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>Hành động</th>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>Nội dung chi tiêu</th>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>Thuộc về</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1.25rem 1.5rem', whiteSpace: 'nowrap' }}>
                    {log.date.toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      background: log.action === 'Thêm mới' ? 'rgba(16, 185, 129, 0.1)' : log.action === 'Xóa' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: log.action === 'Thêm mới' ? 'var(--success-color)' : log.action === 'Xóa' ? 'var(--danger-color)' : 'var(--primary-color)'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: 600 }}>{log.item}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {formatMoney(log.amount)}
                      {log.action === 'Cập nhật' && log.oldAmount !== log.amount && ` (Cũ: ${formatMoney(log.oldAmount || 0)})`}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    {log.payerName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
