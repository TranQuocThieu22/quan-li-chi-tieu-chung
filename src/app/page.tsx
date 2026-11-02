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
import { parseImages } from '@/lib/shared';
import { BUDGET_COLORS, budgetStatus, vietnamToday } from '@/lib/budget';
import { getSharedBudget } from '@/lib/budget-server';
import { expenseShares, groupByMonth, settleDebts, type DebtTransaction } from '@/lib/debts';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { user, partnership, partnerships } = await requirePartnershipPage();

  const resolvedParams = await searchParams;
  const month = resolvedParams.month || vietnamToday().month; // YYYY-MM, theo giờ Việt Nam
  
  const [year, monthStr] = month.split('-');
  const start = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
  const end = new Date(parseInt(year), parseInt(monthStr), 1);

  const members = partnership.members;

  const [expenses, previousUnsettled] = await Promise.all([
    prisma.expense.findMany({
      where: {
        isDeleted: false,
        partnershipId: partnership.id,
        date: { gte: start, lt: end }
      },
      orderBy: { date: 'desc' },
      include: { payer: true, beneficiary: true, histories: true }
    }),
    // Nợ chưa trả của các tháng trước tháng đang xem, cộng vào "Cần thanh toán"
    prisma.expense.findMany({
      where: { isDeleted: false, isSettled: false, partnershipId: partnership.id, date: { lt: start } },
      select: { id: true, amount: true, payerId: true, beneficiaryId: true, date: true },
    }),
  ]);

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
    shares: exp.isSettled ? null : expenseShares(members, exp),
  }));

  // Khoản đã trả không tính vào tổng chung và công nợ
  const unsettledExpenses = expenses.filter(exp => !exp.isSettled);
  const { sharedTotal: totalSharedExpenses, average, balances } = settleDebts(members, unsettledExpenses);

  // Cần thanh toán = nợ tháng đang xem + nợ chưa trả của mọi tháng trước đó, bù trừ chung một lượt
  const carriedMonths = groupByMonth(previousUnsettled).map(g => ({
    month: g.month,
    count: g.items.length,
    transactions: settleDebts(members, g.items).transactions,
  }));
  const { transactions } = settleDebts(members, [...unsettledExpenses, ...previousUnsettled]);
  const toSettle = [...unsettledExpenses, ...previousUnsettled];

  const settledExpenses = expenses.filter(exp => exp.isSettled);

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

      {/* Việc cần làm nhất lên đầu: ai trả ai bao nhiêu */}
      <section className="card hero">
        <div className="card-title">Cần thanh toán</div>
        {carriedMonths.length > 0 && (
          <p className="hero-meta" style={{ marginBottom: '0.625rem' }}>
            Đã cộng nợ chưa trả của {carriedMonths.length} tháng trước
          </p>
        )}
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
                        note={`Chi tieu chung ${carriedMonths.length > 0 ? 'den ' : ''}thang ${parseInt(monthStr, 10)}/${year}`}
                      />
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {carriedMonths.length > 0 && (
          <ul className="carry-list">
            <li className="carry-row">
              <div className="carry-head">Tháng {formatMonth(month)} <span>· {unsettledExpenses.length} khoản chưa trả</span></div>
              <DebtSummary transactions={settleDebts(members, unsettledExpenses).transactions} />
            </li>
            {carriedMonths.map(m => (
              <li key={m.month} className="carry-row">
                <div className="carry-head">
                  <Link href={`/?month=${m.month}`}>Tháng {formatMonth(m.month)}</Link> <span>· {m.count} khoản chưa trả</span>
                </div>
                <DebtSummary transactions={m.transactions} />
              </li>
            ))}
          </ul>
        )}
        {transactions.length > 0 && (
          <SettleMonthButton
            ids={toSettle.map(exp => exp.id)}
            total={toSettle.reduce((sum, exp) => sum + exp.amount, 0)}
            monthLabel={`tháng ${parseInt(monthStr, 10)}${carriedMonths.length > 0 ? ' và nợ tháng trước' : ''}`}
            label={carriedMonths.length > 0 ? `Đã trả hết nợ đến tháng ${parseInt(monthStr, 10)}` : undefined}
          />
        )}
      </section>

      {/* Tổng gọn hai dòng; ngân sách và ai đã chi gấp lại, bấm mới mở (vượt / sắp hết ngân sách đã có BudgetAlerts ở trên) */}
      <section className="card">
        <div className="card-head">
          <div className="card-title">Tổng chi chung tháng {parseInt(monthStr, 10)}</div>
          <strong className="num summary-total">{formatMoney(totalSharedExpenses)}</strong>
        </div>
        <div className="hero-meta">
          Mỗi người <strong className="num">{formatMoney(average)}</strong>
          {settledExpenses.length > 0 && ` • không tính ${settledExpenses.length} khoản đã trả`}
        </div>

        <details className="data-table">
          <summary>
            Ngân sách{sharedStatus ? ` ${sharedStatus.percent}%` : ''} và ai đã chi
          </summary>

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
        </details>
      </section>

      <ExpenseList expenses={expenseItems} />
      <BottomNav />
    </main>
  )
}

// Nợ của một tháng trong phần chia theo tháng: mỗi cặp một dòng, hoặc "Cân bằng"
function DebtSummary({ transactions }: { transactions: DebtTransaction[] }) {
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  if (transactions.length === 0) return <div className="carry-debt">Cân bằng</div>;
  return transactions.map((t, idx) => (
    <div key={idx} className="carry-debt">
      <span>{t.from} → {t.to}</span>
      <span className="num">{formatMoney(t.amount)}</span>
    </div>
  ));
}
