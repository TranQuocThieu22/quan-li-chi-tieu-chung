import Link from 'next/link';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const expenses = await prisma.expense.findMany({
    where: { isDeleted: false },
    include: { payer: true },
    orderBy: { date: 'desc' }
  });
  
  const members = await prisma.member.findMany();

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

  return (
    <main className="container">
      <header>
        <h1 className="title" style={{marginBottom: 0}}>Thống Kê</h1>
        <Link href="/" className="btn btn-secondary" style={{width: 'auto'}}>Trang Chủ</Link>
      </header>

      <div className="card text-center">
        <h2 className="subtitle">Tổng chi tiêu toàn thời gian</h2>
        <div className="amount debt-negative">{formatMoney(allTimeTotal)}</div>
      </div>

      <div className="card">
        <h2 className="subtitle text-center">Ai chi nhiều nhất? (Bảng vàng)</h2>
        <ul className="expense-list mt-4">
          {sortedMembers.map((m, idx) => (
            <li key={idx} className="expense-item flex-between" style={{padding: '0.75rem 0'}}>
              <span style={{fontWeight: 600}}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''} {m.name}
              </span>
              <span className="debt-positive" style={{fontWeight: 600}}>{formatMoney(m.total)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="subtitle text-center">Biến động theo tháng</h2>
        {sortedMonths.length === 0 ? (
          <p className="text-center mt-4" style={{color: 'var(--text-secondary)'}}>Chưa có dữ liệu.</p>
        ) : (
          <ul className="expense-list mt-4">
            {sortedMonths.map(([month, total]) => (
              <li key={month} className="expense-item flex-between" style={{padding: '0.75rem 0'}}>
                <span style={{fontWeight: 500}}>Tháng {month.split('-')[1]}/{month.split('-')[0]}</span>
                <span style={{fontWeight: 600}}>{formatMoney(total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
