import Link from 'next/link';
import prisma from '@/lib/db';
import MonthSelector from '@/components/MonthSelector';
import ExpenseList, { type ExpenseListItem } from '@/components/ExpenseList';
import LedgerSwitcher from '@/components/LedgerSwitcher';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import ImportBanner from '@/components/ImportBanner';
import RecategorizeBanner from '@/components/RecategorizeBanner';
import { ArrowRightIcon, CheckCircleIcon, PlusIcon } from '@/components/icons';
import { requirePartnershipPage, toLedgerOptions } from '@/lib/auth';
import { formatPercent, getSharedCategory, parseImages, SHARED_CATEGORIES } from '@/lib/shared';

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

  const expenseItems: ExpenseListItem[] = expenses.map(exp => ({
    id: exp.id,
    item: exp.item,
    amount: exp.amount,
    category: exp.category,
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

  // Cùng tập khoản chi với tổng chi chung: chưa trả và không phải mua giùm
  const byCategory = SHARED_CATEGORIES
    .map(c => ({
      ...c,
      total: expenses
        .filter(exp => !exp.isSettled && !exp.beneficiaryId && getSharedCategory(exp.category).key === c.key)
        .reduce((sum, exp) => sum + exp.amount, 0),
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

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
    <main className="container with-nav">
      <PageHeader
        title="Sổ chung"
        subtitle={<LedgerSwitcher ledgers={toLedgerOptions(partnerships, user.id)} currentId={partnership.id} />}
        action={
          <Link href="/add" className="btn btn-primary btn-sm">
            <PlusIcon width={16} height={16} /> Thêm
          </Link>
        }
      />

      <ImportBanner userId={user.id} />
      <RecategorizeBanner partnershipId={partnership.id} />

      <MonthSelector />

      <section className="card hero">
        <div className="hero-label">Tổng chi chung tháng {parseInt(monthStr, 10)}</div>
        <div className="hero-amount">{formatMoney(totalSharedExpenses)}</div>
        <div className="hero-meta">
          Mỗi người: <strong className="num">{formatMoney(average)}</strong>
        </div>
        {settledExpenses.length > 0 && (
          <div className="hero-meta">
            Không tính {settledExpenses.length} khoản đã trả ({formatMoney(settledTotal)})
          </div>
        )}

        <hr className="divider" />

        <div className="card-title" style={{ marginBottom: '0.625rem' }}>Đã chi trả</div>
        <ul className="row-list">
          {balances.map(b => (
            <li key={b.id} className="row">
              <span className="row-label">{b.name}</span>
              <span className="row-value">{formatMoney(b.totalPaid)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="card-title">Cần thanh toán</div>
        {transactions.length === 0 ? (
          <p className="balanced">
            <CheckCircleIcon width={20} height={20} /> Không ai nợ ai! Mọi thứ đã cân bằng.
          </p>
        ) : (
          <ul className="debt-list">
            {transactions.map((t, idx) => (
              <li key={idx} className="debt-row">
                <span className="debt-who">
                  <strong>{t.from}</strong>
                  <ArrowRightIcon />
                  <strong>{t.to}</strong>
                </span>
                <span className="debt-amount">{formatMoney(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {byCategory.length > 0 && (
        <section className="card">
          <div className="card-title">Theo danh mục</div>
          <ul className="bar-list">
            {byCategory.map(c => {
              const percent = Math.round((c.total / totalSharedExpenses) * 100);
              return (
                <li key={c.key}>
                  <div className="bar-head">
                    <span style={{fontWeight: 500}}>{c.icon} {c.label}</span>
                    <span className="num" style={{fontWeight: 600}}>
                      {formatMoney(c.total)} <span className="muted">{formatPercent(c.total, totalSharedExpenses)}</span>
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

      <ExpenseList expenses={expenseItems} />
      <BottomNav />
    </main>
  )
}
