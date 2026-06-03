import Link from 'next/link';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const members = await prisma.member.findMany({ orderBy: { id: 'asc' } });
  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: 'desc' },
    include: { payer: true }
  });

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (members.length === 0) {
    return (
      <div>
        <header>
          <h1 className="title" style={{marginBottom: 0}}>Chi Tiêu Chung</h1>
          <Link href="/admin" className="btn btn-primary" style={{width: 'auto'}}>Cấu hình</Link>
        </header>
        <div className="card text-center">
          <p className="mb-4">Bạn chưa cấu hình danh sách người tham gia.</p>
          <Link href="/admin" className="btn btn-secondary">Tới trang quản trị</Link>
        </div>
      </div>
    );
  }

  // Calculate totals
  const memberTotals: Record<number, number> = {};
  members.forEach(m => memberTotals[m.id] = 0);

  let totalExpenses = 0;
  expenses.forEach(exp => {
    if (memberTotals[exp.payerId] !== undefined) {
      memberTotals[exp.payerId] += exp.amount;
      totalExpenses += exp.amount;
    }
  });

  const average = totalExpenses / members.length;
  
  // Calculate balances
  // > 0 means they paid more than average (they are owed money)
  // < 0 means they paid less than average (they owe money)
  const balances = members.map(m => ({
    id: m.id,
    name: m.name,
    totalPaid: memberTotals[m.id],
    balance: memberTotals[m.id] - average
  }));

  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance); // most negative first
  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance); // most positive first

  type DebtTransaction = { from: string, to: string, amount: number };
  const transactions: DebtTransaction[] = [];

  let d = 0;
  let c = 0;
  
  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    
    const amount = Math.min(-debtor.balance, creditor.balance);
    
    if (amount > 0.01) {
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount
      });
    }

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) d++;
    if (Math.abs(creditor.balance) < 0.01) c++;
  }

  return (
    <div>
      <header>
        <h1 className="title" style={{marginBottom: 0}}>Chi Tiêu Chung</h1>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <Link href="/admin" className="btn btn-secondary" style={{width: 'auto'}}>Cấu hình</Link>
          <Link href="/add" className="btn btn-primary" style={{width: 'auto'}}>+ Thêm</Link>
        </div>
      </header>

      <div className="card text-center">
        <h2 className="subtitle">Tổng chi tiêu nhóm</h2>
        <div className="amount mb-4">{formatMoney(totalExpenses)}</div>
        <p className="subtitle">Trung bình mỗi người: {formatMoney(average)}</p>
        
        <div className="mt-6" style={{textAlign: 'left'}}>
          <h3 className="subtitle" style={{fontWeight: 600}}>Đã chi trả:</h3>
          <ul style={{listStyle: 'none', marginTop: '0.5rem'}}>
            {balances.map(b => (
              <li key={b.id} className="flex-between" style={{padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)'}}>
                <span>{b.name}</span>
                <span style={{fontWeight: 600}}>{formatMoney(b.totalPaid)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="subtitle text-center">Tính toán nợ nần</h2>
        {transactions.length === 0 ? (
          <p className="text-center mt-4" style={{color: 'var(--success-color)', fontWeight: 500}}>
            Không ai nợ ai! Mọi thứ đã cân bằng.
          </p>
        ) : (
          <ul className="expense-list mt-4">
            {transactions.map((t, idx) => (
              <li key={idx} className="expense-item flex-between" style={{background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem'}}>
                <div style={{fontSize: '1rem'}}>
                  <strong>{t.from}</strong> trả <strong>{t.to}</strong>
                </div>
                <div className="amount debt-negative" style={{fontSize: '1.25rem'}}>
                  {formatMoney(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="title mt-6">Lịch sử chi tiêu</h2>
      <div className="card">
        {expenses.length === 0 ? (
          <p className="text-center" style={{color: 'var(--text-secondary)'}}>Chưa có khoản chi nào.</p>
        ) : (
          <ul className="expense-list">
            {expenses.map(exp => (
              <li key={exp.id} className="expense-item">
                <div className="expense-info">
                  <h4>{exp.item}</h4>
                  <p>{new Date(exp.createdAt).toLocaleDateString('vi-VN')} • Trả bởi {exp.payer?.name || 'Không rõ'}</p>
                  {exp.notes && <p style={{fontStyle: 'italic', marginTop: '4px'}}>{exp.notes}</p>}
                </div>
                <div className="expense-amount">
                  {formatMoney(exp.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
