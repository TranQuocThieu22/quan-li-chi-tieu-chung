import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import MonthSelector from '@/components/MonthSelector';
import PersonalExpenseActions from '@/components/PersonalExpenseActions';
import BudgetEditor from '@/components/BudgetEditor';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { PlusIcon } from '@/components/icons';
import { getCurrentUser } from '@/lib/auth';
import { getCategory, PERSONAL_CATEGORIES } from '@/lib/personal';
import { getSharedSpendingShare } from '@/lib/spending';

export const dynamic = 'force-dynamic';

export default async function PersonalPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const resolvedParams = await searchParams;
  const month = resolvedParams.month || currentMonth;

  const [year, monthStr] = month.split('-');
  const start = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
  const end = new Date(parseInt(year), parseInt(monthStr), 1);
  const prevStart = new Date(parseInt(year), parseInt(monthStr) - 2, 1);

  const [expenses, prevAggregate, shared, budgetRecord] = await Promise.all([
    prisma.personalExpense.findMany({
      where: { userId: user.id, isDeleted: false, date: { gte: start, lt: end } },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    }),
    prisma.personalExpense.aggregate({
      _sum: { amount: true },
      where: { userId: user.id, isDeleted: false, date: { gte: prevStart, lt: start } },
    }),
    getSharedSpendingShare(user.id, start, end),
    // Ngân sách của tháng này, hoặc ngân sách gần nhất đặt ở tháng trước đó
    prisma.personalBudget.findFirst({
      where: { userId: user.id, month: { lte: month } },
      orderBy: { month: 'desc' },
    }),
  ]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  const formatMonth = (value: string) => `${value.split('-')[1]}/${value.split('-')[0]}`;

  const hasPartnership = shared.ledgers.length > 0;
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const prevTotal = prevAggregate._sum.amount ?? 0;
  const changePercent = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;

  const realTotal = total + shared.total;

  const budget = budgetRecord && budgetRecord.amount > 0 ? budgetRecord.amount : null;
  const inheritedFrom = budget && budgetRecord && budgetRecord.month !== month ? budgetRecord.month : null;
  const budgetPercent = budget ? Math.round((realTotal / budget) * 100) : 0;
  const remaining = budget ? budget - realTotal : 0;
  const budgetColor = budgetPercent > 100 ? 'var(--danger-color)' : budgetPercent >= 80 ? 'var(--warning-color)' : 'var(--success-color)';

  // Gợi ý mức chi mỗi ngày cho phần còn lại của tháng hiện tại
  const daysLeft = month === currentMonth
    ? new Date(parseInt(year), parseInt(monthStr), 0).getDate() - new Date().getDate() + 1
    : 0;
  const dailyAllowance = budget && remaining > 0 && daysLeft > 0 ? Math.floor(remaining / daysLeft) : null;

  const byCategory = PERSONAL_CATEGORIES
    .map(c => ({ ...c, total: expenses.filter(exp => getCategory(exp.category).key === c.key).reduce((sum, exp) => sum + exp.amount, 0) }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <main className="container with-nav">
      <PageHeader
        title="Chi tiêu cá nhân"
        action={
          <Link href="/personal/add" className="btn btn-primary btn-sm">
            <PlusIcon width={16} height={16} /> Thêm
          </Link>
        }
      />

      {!hasPartnership && (
        <div className="notice notice-info">
          <span>Muốn chia sẻ chi tiêu với người thân? Liên kết với tài khoản Google của họ.</span>
          <Link href="/admin">Liên kết →</Link>
        </div>
      )}

      <MonthSelector />

      <section className="card hero">
        <div className="hero-label">Tổng chi thực tế tháng {parseInt(monthStr, 10)}</div>
        <div className="hero-amount">{formatMoney(realTotal)}</div>

        {hasPartnership && (
          <ul className="row-list mt-4">
            <li className="row">
              <span className="row-label">Chi cá nhân</span>
              <span className="row-value">{formatMoney(total)}</span>
            </li>
            <li className="row">
              <span className="row-label">Phần của bạn trong sổ chung</span>
              <span className="row-value">{formatMoney(shared.total)}</span>
            </li>
            {shared.ledgers.map(l => (
              <li key={l.partnershipId} className="row sub">
                <span className="row-label">với {l.partnerName}</span>
                <span className="row-value">{formatMoney(l.share)}</span>
              </li>
            ))}
          </ul>
        )}

        <hr className="divider" />

        <div className="card-head">
          <div className="card-title">Ngân sách tháng {formatMonth(month)}</div>
          <BudgetEditor month={month} amount={budget} />
        </div>

        {budget ? (
          <>
            <div className="bar-head">
              <span className="num">{formatMoney(realTotal)} <span className="muted">/ {formatMoney(budget)}</span></span>
              <strong style={{color: budgetColor}}>{budgetPercent}%</strong>
            </div>
            <div
              className="progress lg"
              role="progressbar"
              aria-label="Mức sử dụng ngân sách"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(budgetPercent, 100)}
            >
              <div className="progress-bar" style={{width: `${Math.min(budgetPercent, 100)}%`, background: budgetColor}} />
            </div>
            <p className={`mt-2${remaining >= 0 ? '' : ' text-danger'}`} style={{fontWeight: 600}}>
              {remaining >= 0 ? `Còn lại ${formatMoney(remaining)}` : `Vượt ngân sách ${formatMoney(-remaining)}`}
            </p>
            {dailyAllowance !== null && (
              <p className="text-muted text-sm">
                {`Còn ${daysLeft} ngày • nên chi tối đa ${formatMoney(dailyAllowance)}/ngày`}
              </p>
            )}
            {inheritedFrom && (
              <p className="text-muted text-sm">{`Áp dụng từ tháng ${formatMonth(inheritedFrom)}`}</p>
            )}
          </>
        ) : (
          <p className="text-muted text-sm">Chưa đặt ngân sách cho tháng này.</p>
        )}
      </section>

      <div className="stat-grid">
        <div className="card">
          <div className="stat-label">Chi cá nhân</div>
          <div className="stat-value">{formatMoney(total)}</div>
          <div className="stat-meta">
            {expenses.length} khoản
            {changePercent !== null && changePercent !== 0 && (
              <span className={changePercent > 0 ? 'text-danger' : 'text-success'} style={{fontWeight: 600, marginLeft: '0.375rem'}}>
                {changePercent > 0 ? '▲' : '▼'} {Math.abs(changePercent)}%
              </span>
            )}
          </div>
        </div>
        <div className="card">
          <div className="stat-label">Tháng trước</div>
          <div className="stat-value">{formatMoney(prevTotal)}</div>
          <div className="stat-meta">Chi cá nhân {prevStart.getMonth() + 1}/{prevStart.getFullYear()}</div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <section className="card">
          <div className="card-title">Theo danh mục</div>
          <ul className="bar-list">
            {byCategory.map(c => {
              const percent = Math.round((c.total / total) * 100);
              return (
                <li key={c.key}>
                  <div className="bar-head">
                    <span style={{fontWeight: 500}}>{c.icon} {c.label}</span>
                    <span className="num" style={{fontWeight: 600}}>
                      {formatMoney(c.total)} <span className="muted">{percent}%</span>
                    </span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{width: `${percent}%`}} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="section-head">
        <h2 className="section-title">Danh sách chi tiêu</h2>
      </div>
      <div className="card">
        {expenses.length === 0 ? (
          <div className="empty">
            <p>Chưa có khoản chi cá nhân nào trong tháng này.</p>
            <Link href="/personal/add" className="btn btn-primary">
              <PlusIcon width={16} height={16} /> Thêm khoản chi
            </Link>
          </div>
        ) : (
          <ul className="expense-list">
            {expenses.map(exp => {
              const category = getCategory(exp.category);
              return (
                <li key={exp.id} className="expense-item">
                  <div className="expense-row">
                    <div className="avatar emoji" aria-hidden>{category.icon}</div>
                    <div className="expense-body">
                      <div className="expense-top">
                        <div className="expense-title">{exp.item}</div>
                        <div className="expense-amount">{formatMoney(exp.amount)}</div>
                      </div>
                      <div className="expense-meta">{new Date(exp.date).toLocaleDateString('vi-VN')} • {category.label}</div>
                      {exp.notes && <p className="expense-note">{exp.notes}</p>}
                      <PersonalExpenseActions id={exp.id} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <BottomNav shared={hasPartnership} />
    </main>
  );
}
