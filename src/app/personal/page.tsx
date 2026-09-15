import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import MonthSelector from '@/components/MonthSelector';
import PersonalExpenseActions from '@/components/PersonalExpenseActions';
import { getCurrentUser } from '@/lib/auth';
import { getCategory, PERSONAL_CATEGORIES } from '@/lib/personal';

export const dynamic = 'force-dynamic';

export default async function PersonalPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const resolvedParams = await searchParams;
  const month = resolvedParams.month || new Date().toISOString().slice(0, 7); // YYYY-MM

  const [year, monthStr] = month.split('-');
  const start = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
  const end = new Date(parseInt(year), parseInt(monthStr), 1);
  const prevStart = new Date(parseInt(year), parseInt(monthStr) - 2, 1);

  const [expenses, prevAggregate, partnershipCount] = await Promise.all([
    prisma.personalExpense.findMany({
      where: { userId: user.id, isDeleted: false, date: { gte: start, lt: end } },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    }),
    prisma.personalExpense.aggregate({
      _sum: { amount: true },
      where: { userId: user.id, isDeleted: false, date: { gte: prevStart, lt: start } },
    }),
    prisma.partnership.count({ where: { endedAt: null, OR: [{ userAId: user.id }, { userBId: user.id }] } }),
  ]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const prevTotal = prevAggregate._sum.amount ?? 0;
  const changePercent = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;

  const byCategory = PERSONAL_CATEGORIES
    .map(c => ({ ...c, total: expenses.filter(exp => getCategory(exp.category).key === c.key).reduce((sum, exp) => sum + exp.amount, 0) }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <main className="container">
      <header>
        <h1 className="title" style={{marginBottom: 0}}>Chi Tiêu Cá Nhân</h1>
        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
          {partnershipCount > 0 && <Link href="/" className="btn btn-secondary" style={{width: 'auto'}}>Chi tiêu chung</Link>}
          <Link href="/admin" className="btn btn-secondary" style={{width: 'auto'}}>Liên kết</Link>
          <Link href="/personal/add" className="btn btn-primary" style={{width: 'auto'}}>+ Thêm</Link>
        </div>
      </header>

      {partnershipCount === 0 && (
        <div className="card flex-between" style={{gap: '1rem', flexWrap: 'wrap', padding: '1rem 1.5rem'}}>
          <span style={{color: 'var(--text-secondary)'}}>Muốn chia sẻ chi tiêu với người thân? Liên kết với tài khoản Google của họ.</span>
          <Link href="/admin" style={{color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none'}}>Liên kết ngay →</Link>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <MonthSelector />
      </div>

      <div className="card text-center">
        <h2 className="subtitle">Tổng chi tiêu cá nhân tháng {monthStr}</h2>
        <div className="amount mb-4">{formatMoney(total)}</div>
        <p className="subtitle" style={{marginBottom: 0}}>
          {expenses.length} khoản • Tháng trước: {formatMoney(prevTotal)}
          {changePercent !== null && changePercent !== 0 && (
            <span style={{marginLeft: '0.5rem', fontWeight: 600, color: changePercent > 0 ? 'var(--danger-color)' : 'var(--success-color)'}}>
              {changePercent > 0 ? '▲' : '▼'} {Math.abs(changePercent)}%
            </span>
          )}
        </p>
      </div>

      {byCategory.length > 0 && (
        <div className="card">
          <h2 className="subtitle text-center">Theo danh mục</h2>
          <ul style={{listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem'}}>
            {byCategory.map(c => {
              const percent = Math.round((c.total / total) * 100);
              return (
                <li key={c.key}>
                  <div className="flex-between" style={{marginBottom: '0.35rem', gap: '1rem'}}>
                    <span style={{fontWeight: 500}}>{c.icon} {c.label}</span>
                    <span style={{fontWeight: 600, whiteSpace: 'nowrap'}}>
                      {formatMoney(c.total)} <span style={{color: 'var(--text-secondary)', fontWeight: 400}}>({percent}%)</span>
                    </span>
                  </div>
                  <div style={{height: '8px', borderRadius: '999px', background: 'var(--border-color)', overflow: 'hidden'}}>
                    <div style={{width: `${percent}%`, height: '100%', borderRadius: '999px', background: 'var(--primary-color)'}} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <h2 className="title mt-6">Danh sách chi tiêu</h2>
      <div className="card">
        {expenses.length === 0 ? (
          <div className="text-center">
            <p className="mb-4" style={{color: 'var(--text-secondary)'}}>Chưa có khoản chi cá nhân nào trong tháng này.</p>
            <Link href="/personal/add" className="btn btn-primary" style={{width: 'auto', display: 'inline-flex'}}>+ Thêm khoản chi</Link>
          </div>
        ) : (
          <ul className="expense-list">
            {expenses.map(exp => {
              const category = getCategory(exp.category);
              return (
                <li key={exp.id} className="expense-item" style={{display: 'block'}}>
                  <div className="flex-between" style={{alignItems: 'flex-start', gap: '1rem'}}>
                    <div className="expense-info">
                      <h4>{category.icon} {exp.item}</h4>
                      <p>{new Date(exp.date).toLocaleDateString('vi-VN')} • {category.label}</p>
                      {exp.notes && <p style={{fontStyle: 'italic', marginTop: '4px'}}>{exp.notes}</p>}
                    </div>
                    <div className="expense-amount">
                      {formatMoney(exp.amount)}
                    </div>
                  </div>
                  <PersonalExpenseActions id={exp.id} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
