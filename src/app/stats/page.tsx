import Link from 'next/link';
import prisma from '@/lib/db';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getPartner, requirePartnershipPage } from '@/lib/auth';
import { formatPercent, getSharedCategory, SHARED_CATEGORIES } from '@/lib/shared';

export const dynamic = 'force-dynamic';

const RANGES = [
  { key: '6', label: '6 tháng', months: 6 },
  { key: '12', label: '12 tháng', months: 12 },
  { key: 'all', label: 'Tất cả', months: null },
] as const;

// Biểu đồ cột chỉ vẽ tối đa ngần này tháng để cột không quá mảnh trên điện thoại
const CHART_MAX_MONTHS = 12;

const monthKey = (date: Date) => date.toISOString().slice(0, 7); // YYYY-MM

// Danh sách tháng liên tiếp từ from tới to (gồm cả hai đầu), để tháng không chi gì vẫn hiện số 0
function monthsBetween(from: string, to: string) {
  const keys: string[] = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return keys;
}

function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return monthKey(d);
}

// Mốc trục tung tròn: 0, nửa, đỉnh
function niceCeil(value: number) {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * exp) return step * exp;
  }
  return 10 * exp;
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// Số gọn cho trục và nhãn cột: 1,5tr / 850k
function formatCompact(amount: number) {
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n);
  if (amount >= 1_000_000) return `${fmt(amount / 1_000_000)}tr`;
  if (amount >= 1_000) return `${fmt(amount / 1_000)}k`;
  return fmt(amount);
}

const monthLabel = (key: string) => `${Number(key.slice(5))}/${key.slice(0, 4)}`;

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { user, partnership } = await requirePartnershipPage();
  const { range: rangeParam } = await searchParams;
  const range = RANGES.find(r => r.key === rangeParam) ?? RANGES[0];

  const expenses = await prisma.expense.findMany({
    where: { isDeleted: false, partnershipId: partnership.id },
    orderBy: { date: 'desc' },
  });

  const currentMonth = monthKey(new Date());
  const latestMonth = expenses.length > 0 ? monthKey(expenses[0].date) : currentMonth;
  const earliestMonth = expenses.length > 0 ? monthKey(expenses[expenses.length - 1].date) : currentMonth;
  // Khoản nhập trước cho tháng sau vẫn được tính
  const endMonth = latestMonth > currentMonth ? latestMonth : currentMonth;
  const startMonth = range.months ? shiftMonth(currentMonth, -(range.months - 1)) : earliestMonth < endMonth ? earliestMonth : endMonth;
  const months = monthsBetween(startMonth, endMonth);

  const inRange = expenses.filter(e => {
    const key = monthKey(e.date);
    return key >= startMonth && key <= endMonth;
  });
  // Chi chung: mọi khoản không phải mua giùm, tính cả khoản đã trả (đã trả chỉ là đã thanh toán với nhau, tiền vẫn đã chi)
  const shared = inRange.filter(e => e.beneficiaryId === null);
  const onBehalf = inRange.filter(e => e.beneficiaryId !== null);

  const total = shared.reduce((sum, e) => sum + e.amount, 0);
  const monthTotals = new Map(months.map(k => [k, 0]));
  shared.forEach(e => {
    const key = monthKey(e.date);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + e.amount);
  });
  const average = months.length > 0 ? total / months.length : 0;

  const thisMonthTotal = monthTotals.get(currentMonth) ?? 0;
  const previousMonths = months.filter(k => k < currentMonth);
  const previousAverage = previousMonths.length > 0
    ? previousMonths.reduce((sum, k) => sum + (monthTotals.get(k) ?? 0), 0) / previousMonths.length
    : 0;
  const deltaPercent = previousAverage > 0 ? Math.round(((thisMonthTotal - previousAverage) / previousAverage) * 100) : null;

  const peak = [...monthTotals.entries()].reduce<[string, number] | null>(
    (best, entry) => (best === null || entry[1] > best[1] ? entry : best),
    null,
  );

  const chartMonths = months.slice(-CHART_MAX_MONTHS);
  const chartMax = niceCeil(Math.max(0, ...chartMonths.map(k => monthTotals.get(k) ?? 0)));
  const chartAverage = chartMonths.reduce((sum, k) => sum + (monthTotals.get(k) ?? 0), 0) / (chartMonths.length || 1);

  const byCategory = SHARED_CATEGORIES
    .map(c => {
      const items = shared.filter(e => getSharedCategory(e.category).key === c.key);
      return { ...c, count: items.length, total: items.reduce((sum, e) => sum + e.amount, 0) };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const memberName = new Map(partnership.members.map(m => [m.id, m.name]));
  const byPayer = partnership.members
    .map(m => ({ id: m.id, name: m.name, total: shared.filter(e => e.payerId === m.id).reduce((sum, e) => sum + e.amount, 0) }))
    .sort((a, b) => b.total - a.total);
  // Màu theo người (thứ tự thành viên cố định), không theo thứ hạng — đổi khoảng thời gian không đổi màu
  const seriesColor = new Map(partnership.members.map((m, i) => [m.id, i === 0 ? 'var(--series-1)' : 'var(--series-2)']));

  const onBehalfGroups = [...onBehalf.reduce((groups, e) => {
    const key = `${e.payerId}-${e.beneficiaryId}`;
    const group = groups.get(key) ?? { payer: memberName.get(e.payerId) ?? 'Không rõ', beneficiary: memberName.get(e.beneficiaryId!) ?? 'Không rõ', count: 0, total: 0 };
    group.count++;
    group.total += e.amount;
    return groups.set(key, group);
  }, new Map<string, { payer: string; beneficiary: string; count: number; total: number }>()).values()];

  const topExpenses = [...shared].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <main className="container with-nav">
      <PageHeader title="Thống kê" subtitle={`Sổ chung với ${getPartner(partnership, user.id).name}`} />

      <nav className="segmented" aria-label="Khoảng thời gian">
        {RANGES.map(r => (
          <Link key={r.key} href={`/stats?range=${r.key}`} aria-current={r.key === range.key ? 'page' : undefined} replace>
            {r.label}
          </Link>
        ))}
      </nav>

      {shared.length === 0 ? (
        <div className="card"><p className="empty">Chưa có khoản chi chung nào trong khoảng này.</p></div>
      ) : (
        <>
          <section className="card hero">
            <div className="hero-label">
              Tổng chi chung {range.months ? `${range.months} tháng gần nhất` : `từ tháng ${monthLabel(startMonth)}`}
            </div>
            <div className="hero-amount">{formatMoney(total)}</div>
            <div className="hero-meta">
              Trung bình <strong>{formatMoney(Math.round(average))}</strong>/tháng • {shared.length} khoản
            </div>
            <div className="hero-meta">Tính cả khoản đã trả, không tính khoản mua giùm.</div>
          </section>

          <div className="stat-grid">
            <div className="card">
              <div className="stat-label">Tháng này</div>
              <div className="stat-value">{formatMoney(thisMonthTotal)}</div>
              <div className="stat-meta">
                {deltaPercent === null ? 'Chưa có tháng trước để so' : deltaPercent === 0 ? 'Bằng trung bình' : (
                  <span className={deltaPercent > 0 ? 'text-danger' : 'text-success'} style={{ fontWeight: 600 }}>
                    {deltaPercent > 0 ? '▲' : '▼'} {Math.abs(deltaPercent)}% so với TB
                  </span>
                )}
              </div>
            </div>
            <div className="card">
              <div className="stat-label">Tháng chi nhiều nhất</div>
              <div className="stat-value">{peak ? formatMoney(peak[1]) : '—'}</div>
              <div className="stat-meta">{peak ? `Tháng ${monthLabel(peak[0])}` : ''}</div>
            </div>
          </div>

          <section className="card">
            <div className="card-head">
              <div className="card-title">
                Chi chung theo tháng{months.length > CHART_MAX_MONTHS ? ` (${CHART_MAX_MONTHS} tháng gần nhất)` : ''}
              </div>
              <span className="chart-key"><span className="chart-key-line" aria-hidden /> TB {formatCompact(Math.round(chartAverage))}</span>
            </div>
            <div className="col-chart">
              <div className="col-axis" aria-hidden>
                <span>{formatCompact(chartMax)}</span>
                <span>{formatCompact(chartMax / 2)}</span>
                <span>0</span>
              </div>
              <div className="col-plot">
                <div className="col-grid" aria-hidden><span /><span /><span /></div>
                <div className="col-avg" style={{ '--r': chartAverage / chartMax } as React.CSSProperties} aria-hidden />
                <ul className="col-bars">
                  {chartMonths.map(k => {
                    const value = monthTotals.get(k) ?? 0;
                    const height = (value / chartMax) * 100;
                    const isCurrent = k === currentMonth;
                    return (
                      <li key={k} className={`col-item${isCurrent ? ' current' : ''}`}>
                        <button type="button" className="col" aria-label={`Tháng ${monthLabel(k)}: ${formatMoney(value)}`}>
                          <span className="col-bar" style={{ height: `${height}%` }} />
                          {isCurrent && value > 0 && (
                            <span className="col-label" style={{ bottom: `${height}%` }} aria-hidden>{formatCompact(value)}</span>
                          )}
                          <span className="col-tip" style={{ bottom: `${height}%` }} aria-hidden>
                            <strong>{formatMoney(value)}</strong>
                            <span>Tháng {monthLabel(k)}</span>
                          </span>
                        </button>
                        <span className="col-x" aria-hidden>T{Number(k.slice(5))}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <details className="data-table">
              <summary>Xem bảng số liệu</summary>
              <ul className="row-list">
                {[...months].reverse().map(k => (
                  <li key={k} className="row">
                    <span className="row-label">Tháng {monthLabel(k)}</span>
                    <span className="row-value">{formatMoney(monthTotals.get(k) ?? 0)}</span>
                  </li>
                ))}
              </ul>
            </details>
          </section>

          <section className="card">
            <div className="card-title">Theo danh mục</div>
            <ul className="bar-list">
              {byCategory.map(c => {
                const percent = Math.round((c.total / total) * 100);
                return (
                  <li key={c.key}>
                    <div className="bar-head">
                      <span style={{ fontWeight: 500 }}>{c.icon} {c.label} <span className="muted">{c.count} khoản</span></span>
                      <span className="num" style={{ fontWeight: 600 }}>
                        {formatMoney(c.total)} <span className="muted">{formatPercent(c.total, total)}</span>
                      </span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${percent}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card">
            <div className="card-title">Ai đã chi</div>
            <div className="split-bar" role="img" aria-label={byPayer.map(p => `${p.name} ${formatPercent(p.total, total)}`).join(', ')}>
              {byPayer.filter(p => p.total > 0).map(p => (
                <span key={p.id} style={{ width: `${(p.total / total) * 100}%`, background: seriesColor.get(p.id) }} />
              ))}
            </div>
            <ul className="row-list mt-4">
              {byPayer.map(p => (
                <li key={p.id} className="row">
                  <span className="row-label">
                    <span className="legend-dot" style={{ background: seriesColor.get(p.id) }} aria-hidden />
                    {p.name}
                  </span>
                  <span className="row-value">
                    {formatMoney(p.total)} <span className="text-muted" style={{ fontWeight: 400 }}>{formatPercent(p.total, total)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted text-sm mt-2">Chia đều mỗi người {formatMoney(Math.round(total / (partnership.members.length || 1)))}.</p>
          </section>

          <section className="card">
            <div className="card-title">Khoản chi lớn nhất</div>
            <ul className="row-list">
              {topExpenses.map(e => {
                const c = getSharedCategory(e.category);
                return (
                  <li key={e.id} className="row">
                    <span className="row-label">
                      {c.icon} {e.item}
                      <span className="expense-meta" style={{ display: 'block' }}>
                        {e.date.toLocaleDateString('vi-VN')} • {memberName.get(e.payerId) ?? 'Không rõ'} trả
                      </span>
                    </span>
                    <span className="row-value">{formatMoney(e.amount)}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {onBehalfGroups.length > 0 && (
            <section className="card">
              <div className="card-title">Mua giùm (không tính vào chi chung)</div>
              <ul className="row-list">
                {onBehalfGroups.map(g => (
                  <li key={`${g.payer}-${g.beneficiary}`} className="row">
                    <span className="row-label">{g.payer} mua giùm {g.beneficiary} <span className="text-muted text-sm">• {g.count} khoản</span></span>
                    <span className="row-value">{formatMoney(g.total)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <BottomNav />
    </main>
  );
}
