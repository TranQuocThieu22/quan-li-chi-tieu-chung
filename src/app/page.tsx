import Link from 'next/link';
import prisma from '@/lib/db';
import MonthSelector from '@/components/MonthSelector';
import ExpenseList, { type ExpenseListItem } from '@/components/ExpenseList';
import LedgerSwitcher from '@/components/LedgerSwitcher';
import { requirePartnershipPage, toLedgerOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { user, partnership, partnerships } = await requirePartnershipPage();

  const resolvedParams = await searchParams;
  const month = resolvedParams.month || new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const [year, monthStr] = month.split('-');
  const start = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
  const end = new Date(parseInt(year), parseInt(monthStr), 1);

  const members = partnership.members;

  const expenses = await prisma.expense.findMany({
    where: {
      isDeleted: false,
      partnershipId: partnership.id,
      date: { gte: start, lt: end }
    },
    orderBy: { date: 'desc' },
    include: { payer: true, beneficiary: true, histories: true }
  });

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // imageUrl lưu dạng JSON mảng, dữ liệu cũ có thể chỉ là một đường dẫn
  const parseImages = (imageUrl: string | null) => {
    if (!imageUrl || imageUrl === '[]') return [];
    try {
      const parsed = JSON.parse(imageUrl);
      return Array.isArray(parsed) ? (parsed as string[]) : [imageUrl];
    } catch {
      return [imageUrl];
    }
  };

  const expenseItems: ExpenseListItem[] = expenses.map(exp => ({
    id: exp.id,
    item: exp.item,
    amount: exp.amount,
    date: exp.date.toISOString(),
    payerName: exp.payer?.name || 'Không rõ',
    beneficiaryName: exp.beneficiaryId ? exp.beneficiary?.name ?? null : null,
    notes: exp.notes,
    images: parseImages(exp.imageUrl),
    isSettled: exp.isSettled,
    hasHistory: exp.histories.length > 0,
  }));

  // Calculate totals
  const memberTotals: Record<number, number> = {};
  const memberBalances: Record<number, number> = {};
  members.forEach(m => {
    memberTotals[m.id] = 0;
    memberBalances[m.id] = 0;
  });

  let totalSharedExpenses = 0;
  
  expenses.forEach(exp => {
    // Khoản đã trả không tính vào tổng chung và công nợ
    if (exp.isSettled) return;

    if (memberTotals[exp.payerId] !== undefined) {
      memberTotals[exp.payerId] += exp.amount;
      memberBalances[exp.payerId] += exp.amount;
    }
    
    if (exp.beneficiaryId) {
      if (memberBalances[exp.beneficiaryId] !== undefined) {
        memberBalances[exp.beneficiaryId] -= exp.amount;
      }
    } else {
      totalSharedExpenses += exp.amount;
    }
  });

  const average = members.length > 0 ? totalSharedExpenses / members.length : 0;

  const settledExpenses = expenses.filter(exp => exp.isSettled);
  const settledTotal = settledExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const balances = members.map(m => {
    const finalBalance = memberBalances[m.id] - average;
    return {
      id: m.id,
      name: m.name,
      totalPaid: memberTotals[m.id],
      balance: finalBalance
    };
  });

  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance); 
  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance); 

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
    <main className="container">
      <header>
        <h1 className="title" style={{marginBottom: 0}}>Chi Tiêu Chung</h1>
        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
          <Link href="/personal" className="btn btn-secondary" style={{width: 'auto'}}>Cá nhân</Link>
          <Link href="/stats" className="btn btn-secondary" style={{width: 'auto'}}>Thống kê</Link>
          <Link href="/admin" className="btn btn-secondary" style={{width: 'auto'}}>Liên kết</Link>
          <Link href="/add" className="btn btn-primary" style={{width: 'auto'}}>+ Thêm</Link>
        </div>
      </header>

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <LedgerSwitcher ledgers={toLedgerOptions(partnerships, user.id)} currentId={partnership.id} />
        <MonthSelector />
      </div>

      <div className="card text-center">
        <h2 className="subtitle">Tổng chi tiêu chung tháng {month.split('-')[1]}</h2>
        <div className="amount mb-4">{formatMoney(totalSharedExpenses)}</div>
        <p className="subtitle">Trung bình mỗi người: {formatMoney(average)}</p>
        {settledExpenses.length > 0 && (
          <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>
            Không tính {settledExpenses.length} khoản đã trả ({formatMoney(settledTotal)})
          </p>
        )}
        
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

      <ExpenseList expenses={expenseItems} />
    </main>
  )
}
