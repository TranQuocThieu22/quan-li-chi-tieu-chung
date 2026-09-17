'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ExpenseActions from './ExpenseActions';

export type ExpenseListItem = {
  id: number;
  item: string;
  amount: number;
  date: string;
  payerName: string;
  beneficiaryName: string | null;
  notes: string | null;
  images: string[];
  isSettled: boolean;
  hasHistory: boolean;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function ExpenseList({ expenses }: { expenses: ExpenseListItem[] }) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const selected = selectedIds.filter(id => expenses.some(e => e.id === id));
  const allSelected = expenses.length > 0 && selected.length === expenses.length;
  const selectedTotal = expenses
    .filter(e => selected.includes(e.id))
    .reduce((sum, e) => sum + e.amount, 0);

  const toggleSelecting = () => {
    setSelecting(!selecting);
    setSelectedIds([]);
  };

  const toggleOne = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : expenses.map(e => e.id));
  };

  const runBulk = (action: 'settle' | 'unsettle' | 'delete') => {
    if (selected.length === 0 || isPending) return;
    if (action === 'delete' && !confirm(`Xóa ${selected.length} khoản chi đã chọn? (Lịch sử vẫn được lưu lại)`)) return;

    startTransition(async () => {
      try {
        const res = await fetch('/api/expenses/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selected, action }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || 'Thao tác hàng loạt không thành công');
          return;
        }
        setSelectedIds([]);
        setSelecting(false);
        router.refresh();
      } catch {
        alert('Lỗi kết nối!');
      }
    });
  };

  const bulkBtn = {
    width: 'auto',
    flex: '1 1 auto',
    padding: '0.6rem 1rem',
    fontSize: '0.875rem',
    opacity: isPending ? 0.6 : 1,
  };

  return (
    <>
      <div className="flex-between mt-6" style={{ gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <h2 className="title" style={{ marginBottom: 0 }}>Lịch sử chi tiêu</h2>
        {expenses.length > 0 && (
          <button
            type="button"
            onClick={toggleSelecting}
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            {selecting ? 'Xong' : 'Chọn nhiều'}
          </button>
        )}
      </div>

      <div className="card">
        {expenses.length === 0 ? (
          <p className="text-center" style={{ color: 'var(--text-secondary)' }}>Chưa có khoản chi nào trong tháng này.</p>
        ) : (
          <>
            {selecting && (
              <div
                className="flex-between"
                style={{ gap: '0.75rem', flexWrap: 'wrap', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = selected.length > 0 && !allSelected;
                    }}
                    onChange={toggleAll}
                    style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                  />
                  Chọn tất cả ({expenses.length})
                </label>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Đã chọn {selected.length} • {formatMoney(selectedTotal)}
                </span>
              </div>
            )}

            <ul className="expense-list">
              {expenses.map(exp => (
                <li key={exp.id} className="expense-item" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    {selecting && (
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${exp.item}`}
                        checked={selected.includes(exp.id)}
                        onChange={() => toggleOne(exp.id)}
                        style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.2rem', cursor: 'pointer', flexShrink: 0 }}
                      />
                    )}
                    <div className="flex-between" style={{ alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                      <div className="expense-info">
                        <h4>
                          {exp.item}
                          {exp.isSettled && (
                            <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, verticalAlign: 'middle', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-color)' }}>
                              Đã trả
                            </span>
                          )}
                        </h4>
                        <p>{new Date(exp.date).toLocaleDateString('vi-VN')} • Trả bởi {exp.payerName} {exp.beneficiaryName ? `(Mua giùm ${exp.beneficiaryName})` : ''}</p>
                        {exp.notes && <p style={{ fontStyle: 'italic', marginTop: '4px' }}>{exp.notes}</p>}
                        {exp.images.length > 0 && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {exp.images.map((imgUrl, idx) => (
                              <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imgUrl} alt={`Hóa đơn ${idx + 1}`} style={{ maxHeight: '60px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="expense-amount" style={exp.isSettled ? { textDecoration: 'line-through', color: 'var(--text-secondary)' } : undefined}>
                        {formatMoney(exp.amount)}
                      </div>
                    </div>
                  </div>
                  {!selecting && <ExpenseActions id={exp.id} hasHistory={exp.hasHistory} isSettled={exp.isSettled} />}
                </li>
              ))}
            </ul>

            {selecting && selected.length > 0 && (
              <div
                style={{
                  position: 'sticky',
                  bottom: '1rem',
                  zIndex: 20,
                  marginTop: '1rem',
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-color)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isPending}
                  onClick={() => runBulk('settle')}
                  style={{ ...bulkBtn, background: 'var(--success-color)' }}
                >
                  Đánh dấu đã trả
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isPending}
                  onClick={() => runBulk('unsettle')}
                  style={bulkBtn}
                >
                  Bỏ đã trả
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={isPending}
                  onClick={() => runBulk('delete')}
                  style={{ ...bulkBtn, background: 'var(--danger-color)', color: '#fff' }}
                >
                  Xóa
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
