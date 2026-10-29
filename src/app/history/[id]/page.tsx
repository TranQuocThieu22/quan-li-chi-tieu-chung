import PageHeader from '@/components/PageHeader';
import prisma from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { getActivePartnerships, getCurrentUser } from '@/lib/auth';
import { getSharedCategory } from '@/lib/shared';

export const dynamic = 'force-dynamic';

const ACTION_LABELS: Record<string, string> = {
  SETTLE: 'ĐÃ TRẢ',
  UNSETTLE: 'BỎ ĐÃ TRẢ',
};

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  if (!Number.isInteger(id)) return notFound();

  // Khoản chi thuộc bất kỳ sổ nào người dùng đang liên kết
  const partnerships = await getActivePartnerships(user.id);

  const expense = await prisma.expense.findFirst({
    where: { id, partnershipId: { in: partnerships.map(p => p.id) } },
    include: { payer: true, beneficiary: true, histories: { orderBy: { editedAt: 'desc' } } }
  });

  if (!expense) return notFound();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('vi-VN');
  const categoryLabel = (key: string) => {
    const c = getSharedCategory(key);
    return `${c.icon} ${c.label}`;
  };

  const timeline: Array<{
    id: number, action: string, time: Date,
    old: { item: string, amount: number, category: string, payerName: string, beneficiaryName: string, date: Date },
    new: { item: string, amount: number, category: string, payerName: string, beneficiaryName: string, date: Date }
  }> = [];
  let nextState = {
    item: expense.item,
    amount: expense.amount,
    category: expense.category,
    payerName: expense.payer?.name || 'Không rõ',
    beneficiaryName: expense.beneficiary?.name || 'Chi tiêu chung',
    date: expense.date
  };

  expense.histories.forEach(h => {
    const oldState = {
      item: h.oldItem,
      amount: h.oldAmount,
      // Bản ghi trước khi có danh mục: coi như không đổi
      category: h.oldCategory ?? nextState.category,
      payerName: h.oldPayerName,
      beneficiaryName: h.oldBeneficiaryName || 'Chi tiêu chung',
      date: h.oldDate
    };
    
    timeline.push({
      id: h.id,
      action: h.action,
      time: h.editedAt,
      old: oldState,
      new: nextState
    });

    nextState = oldState;
  });

  // Chỉ hiện những trường có thay đổi; không có gì đổi (vd. đánh dấu đã trả) thì hiện một dòng tóm tắt
  const renderDiffs = (fields: Array<[string, string, string]>) => {
    const changed = fields.filter(([, oldVal, newVal]) => oldVal !== newVal);
    if (changed.length === 0) {
      return <p className="text-muted text-sm">Không thay đổi thông tin khoản chi.</p>;
    }
    return changed.map(([label, oldVal, newVal]) => (
      <div key={label}>
        <div className="diff-label">{label}</div>
        <div className="diff">
          <div className="diff-old">{oldVal}</div>
          <div className="diff-new">{newVal}</div>
        </div>
      </div>
    ));
  };

  const renderState = (state: typeof nextState) => (
    <dl className="kv">
      <dt>Món đồ</dt><dd>{state.item}</dd>
      <dt>Số tiền</dt><dd className="num">{formatMoney(state.amount)}</dd>
      <dt>Danh mục</dt><dd>{categoryLabel(state.category)}</dd>
      <dt>Người trả</dt><dd>{state.payerName}</dd>
      <dt>Mua cho</dt><dd>{state.beneficiaryName}</dd>
      <dt>Ngày mua</dt><dd>{formatDate(state.date)}</dd>
    </dl>
  );

  return (
    <main className="container">
      <PageHeader title="Lịch sử thay đổi" subtitle={expense.item} backHref="/" />

      <section className="card highlight">
        <div className="card-head">
          <div className="card-title">Trạng thái hiện tại</div>
          {expense.isDeleted && <span className="badge badge-danger">Đã xóa</span>}
        </div>
        <dl className="kv">
          <dt>Món đồ</dt><dd>{expense.item}</dd>
          <dt>Số tiền</dt><dd className="num">{formatMoney(expense.amount)}</dd>
          <dt>Danh mục</dt><dd>{categoryLabel(expense.category)}</dd>
          <dt>Người trả</dt><dd>{expense.payer?.name}</dd>
          <dt>Mua cho</dt><dd>{expense.beneficiary?.name || 'Chi tiêu chung'}</dd>
          <dt>Ngày mua</dt><dd>{formatDate(expense.date)}</dd>
          <dt>Đã trả</dt>
          <dd>{expense.isSettled ? `Có${expense.settledAt ? ` (${new Date(expense.settledAt).toLocaleString('vi-VN')})` : ''}` : 'Chưa'}</dd>
        </dl>
      </section>

      <div className="section-head">
        <h2 className="section-title">Dòng thời gian</h2>
      </div>
      {timeline.length === 0 && (
        <p className="text-muted text-sm" style={{marginBottom: '0.75rem'}}>Khoản chi này chưa từng bị chỉnh sửa.</p>
      )}
      <ol className="timeline">
        {timeline.map((event) => (
          <li key={event.id} className={`timeline-item${event.action === 'DELETE' ? ' delete' : ''}`}>
            <div className="card">
              <div className="timeline-head">
                <span className={`badge ${event.action === 'DELETE' ? 'badge-danger' : 'badge-primary'}`}>
                  {ACTION_LABELS[event.action] ?? event.action}
                </span>
                {new Date(event.time).toLocaleString('vi-VN')}
              </div>
              {renderDiffs([
                ['Món đồ', event.old.item, event.new.item],
                ['Số tiền', formatMoney(event.old.amount), formatMoney(event.new.amount)],
                ['Danh mục', categoryLabel(event.old.category), categoryLabel(event.new.category)],
                ['Người trả', event.old.payerName, event.new.payerName],
                ['Mua cho', event.old.beneficiaryName, event.new.beneficiaryName],
                ['Ngày mua', formatDate(event.old.date), formatDate(event.new.date)],
              ])}
            </div>
          </li>
        ))}

        <li className="timeline-item create">
          <div className="card">
            <div className="timeline-head">
              <span className="badge badge-success">TẠO MỚI</span>
              {new Date(expense.createdAt).toLocaleString('vi-VN')}
            </div>
            {renderState(nextState)}
          </div>
        </li>
      </ol>
    </main>
  );
}
