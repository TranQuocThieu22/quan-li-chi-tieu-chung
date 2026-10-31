import Link from 'next/link';
import prisma from '@/lib/db';
import MonthSelector from '@/components/MonthSelector';
import ExpenseList, { type ExpenseListItem } from '@/components/ExpenseList';
import LedgerSwitcher from '@/components/LedgerSwitcher';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import ImportBanner from '@/components/ImportBanner';
import BudgetAlerts from '@/components/BudgetAlerts';
import BudgetEditor from '@/components/BudgetEditor';
import RecategorizeBanner from '@/components/RecategorizeBanner';
import PaymentCard from '@/components/PaymentCard';
import SettleMonthButton from '@/components/SettleMonthButton';
import { ArrowRightIcon, CheckCircleIcon, PlusIcon } from '@/components/icons';
import { requirePartnershipPage, toLedgerOptions } from '@/lib/auth';
import { formatPercent, getSharedCategory, parseImages, SHARED_CATEGORIES } from '@/lib/shared';
import { BUDGET_COLORS, budgetStatus, vietnamToday } from '@/lib/budget';
import { getSharedBudget } from '@/lib/budget-server';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { user, partnership, partnerships } = await requirePartnershipPage();

  const resolvedParams = await searchParams;
  const month = resolvedParams.month || vietnamToday().month; // YYYY-MM, theo giờ Việt Nam
  
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
  const unsettledExpenses = expenses.filter(exp => !exp.isSettled);
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

  type DebtTransaction = { from: string, to: string, toId: number, amount: number };
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
        toId: creditor.id,
        amount: amount
      });
    }

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) d++;
    if (Math.abs(creditor.balance) < 0.01) c++;
  }

  // Tài khoản nhận tiền của người được trả, để hiện mã QR kèm số tiền ngay dưới dòng nợ
  const creditorUserIds = transactions
    .map(t => members.find(m => m.id === t.toId)?.userId)
    .filter((id): id is number => typeof id === 'number');
  const profiles = creditorUserIds.length > 0
    ? await prisma.paymentProfile.findMany({ where: { userId: { in: creditorUserIds } } })
    : [];
  const profileOf = (memberId: number) =>
    profiles.find(p => p.userId === members.find(m => m.id === memberId)?.userId);

  // Ngân sách sổ so với mọi khoản trong tháng, kể cả đã trả và mua giùm — đều là tiền đã chi
  const sharedBudget = await getSharedBudget(partnership.id, month);
  const monthSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const sharedStatus = sharedBudget ? budgetStatus(monthSpent, sharedBudget.amount) : null;
  const formatMonth = (value: string) => `${value.split('-')[1]}/${value.split('-')[0]}`;

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
      <BudgetAlerts userId={user.id} page="shared" />

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

        <div className="card-head">
          <div className="card-title">Ngân sách sổ chung tháng {formatMonth(month)}</div>
          <BudgetEditor month={month} amount={sharedBudget?.amount ?? null} partnershipId={partnership.id} />
        </div>
        {sharedBudget && sharedStatus ? (
          <>
            <div className="bar-head">
              <span className="num">{formatMoney(monthSpent)} <span className="muted">/ {formatMoney(sharedBudget.amount)}</span></span>
              <strong style={{color: BUDGET_COLORS[sharedStatus.level]}}>{sharedStatus.percent}%</strong>
            </div>
            <div className="progress lg" role="progressbar" aria-label="Mức sử dụng ngân sách sổ chung" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(sharedStatus.percent, 100)}>
              <div className="progress-bar" style={{width: `${Math.min(sharedStatus.percent, 100)}%`, background: BUDGET_COLORS[sharedStatus.level]}} />
            </div>
            <p className="hero-meta mt-2">
              {sharedStatus.remaining >= 0 ? `Còn lại ${formatMoney(sharedStatus.remaining)}` : `Vượt ngân sách ${formatMoney(-sharedStatus.remaining)}`}
              {' • tính mọi khoản, kể cả đã trả và mua giùm'}
              {sharedBudget.from !== month && ` • áp dụng từ tháng ${formatMonth(sharedBudget.from)}`}
            </p>
          </>
        ) : (
          <p className="hero-meta">Chưa đặt ngân sách chung cho sổ này.</p>
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
            {transactions.map((t, idx) => {
              const profile = profileOf(t.toId);
              return (
                <li key={idx} className="debt-row">
                  <span className="debt-who">
                    <strong>{t.from}</strong>
                    <ArrowRightIcon />
                    <strong>{t.to}</strong>
                  </span>
                  <span className="debt-amount">{formatMoney(t.amount)}</span>
                  {profile && (
                    <details className="pay">
                      <summary>Chuyển khoản cho {t.to}</summary>
                      <PaymentCard
                        profile={profile}
                        amount={t.amount}
                        note={`Chi tieu chung thang ${parseInt(monthStr, 10)}/${year}`}
                      />
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {transactions.length > 0 && (
          <SettleMonthButton
            ids={unsettledExpenses.map(exp => exp.id)}
            total={unsettledExpenses.reduce((sum, exp) => sum + exp.amount, 0)}
            monthLabel={`tháng ${parseInt(monthStr, 10)}`}
          />
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
