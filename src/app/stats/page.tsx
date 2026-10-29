import prisma from '@/lib/db';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getPartner, requirePartnershipPage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const { user, partnership } = await requirePartnershipPage();

  const expenses = await prisma.expense.findMany({
    where: { isDeleted: false, partnershipId: partnership.id },
    include: { payer: true },
    orderBy: { date: 'desc' }
  });

  const members = partnership.members;

  // Who paid most all time
  const memberTotals: Record<number, number> = {};
  members.forEach(m => memberTotals[m.id] = 0);
  
  let allTimeTotal = 0;

  // Monthly breakdown
  const monthlyTotals: Record<string, number> = {};

  expenses.forEach(exp => {
    allTimeTotal += exp.amount;
    if (memberTotals[exp.payerId] !== undefined) {
      memberTotals[exp.payerId] += exp.amount;
    }
    
    const monthKey = new Date(exp.date).toISOString().slice(0, 7); // YYYY-MM
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + exp.amount;
  });

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const sortedMembers = members.map(m => ({
    name: m.name,
    total: memberTotals[m.id]
  })).sort((a, b) => b.total - a.total);

  const sortedMonths = Object.entries(monthlyTotals).sort((a, b) => b[0].localeCompare(a[0]));

  const maxMonthly = Math.max(0, ...sortedMonths.map(([, total]) => total));

  return (
    <main className="container with-nav">
      <PageHeader title="Thống kê" subtitle={`Sổ chung với ${getPartner(partnership, user.id).name}`} />

      <section className="card hero">
        <div className="hero-label">Tổng chi tiêu toàn thời gian</div>
        <div className="hero-amount">{formatMoney(allTimeTotal)}</div>
        <div className="hero-meta">{expenses.length} khoản • {sortedMonths.length} tháng</div>
      </section>

      <section className="card">
        <div className="card-title">Ai chi nhiều nhất?</div>
        <ul className="bar-list">
          {sortedMembers.map((m, idx) => (
            <li key={idx}>
              <div className="bar-head">
                <span style={{fontWeight: 600}}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''} {m.name}
                </span>
                <span className="num text-success" style={{fontWeight: 600}}>{formatMoney(m.total)}</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{width: `${allTimeTotal > 0 ? (m.total / allTimeTotal) * 100 : 0}%`, background: 'var(--success-solid)'}} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="card-title">Biến động theo tháng</div>
        {sortedMonths.length === 0 ? (
          <p className="empty">Chưa có dữ liệu.</p>
        ) : (
          <ul className="bar-list">
            {sortedMonths.map(([month, total]) => (
              <li key={month}>
                <div className="bar-head">
                  <span style={{fontWeight: 500}}>Tháng {month.split('-')[1]}/{month.split('-')[0]}</span>
                  <span className="num" style={{fontWeight: 600}}>{formatMoney(total)}</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{width: `${maxMonthly > 0 ? (total / maxMonthly) * 100 : 0}%`}} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
