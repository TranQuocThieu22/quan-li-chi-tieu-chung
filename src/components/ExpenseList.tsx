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

  // Màu avatar theo người trả để dễ phân biệt hai người trong sổ
  const payerNames = [...new Set(expenses.map(e => e.payerName))];

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

  return (
    <>
      <div className="section-head">
        <h2 className="section-title">Lịch sử chi tiêu</h2>
        {expenses.length > 0 && (
          <button type="button" onClick={toggleSelecting} className="btn btn-ghost btn-sm">
            {selecting ? 'Xong' : 'Chọn nhiều'}
          </button>
        )}
      </div>

      <div className="card">
        {expenses.length === 0 ? (
          <p className="empty">Chưa có khoản chi nào trong tháng này.</p>
        ) : (
          <>
            {selecting && (
              <div className="select-bar">
                <label>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = selected.length > 0 && !allSelected;
                    }}
                    onChange={toggleAll}
                  />
                  Chọn tất cả ({expenses.length})
                </label>
                <span className="text-muted">
                  {selected.length} khoản • <span className="num">{formatMoney(selectedTotal)}</span>
                </span>
              </div>
            )}

            <ul className="expense-list">
              {expenses.map(exp => (
                <li key={exp.id} className="expense-item">
                  <div className="expense-row">
                    {selecting ? (
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${exp.item}`}
                        checked={selected.includes(exp.id)}
                        onChange={() => toggleOne(exp.id)}
                      />
                    ) : (
                      <div className={`avatar ${payerNames.indexOf(exp.payerName) % 2 === 0 ? 'primary' : 'alt'}`} aria-hidden>
                        {exp.payerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="expense-body">
                      <div className="expense-top">
                        <div className="expense-title">
                          {exp.item}
                          {exp.isSettled && <span className="badge badge-success">Đã trả</span>}
                        </div>
                        <div className={`expense-amount${exp.isSettled ? ' settled' : ''}`}>
                          {formatMoney(exp.amount)}
                        </div>
                      </div>
                      <div className="expense-meta">
                        {new Date(exp.date).toLocaleDateString('vi-VN')} • {exp.payerName} trả
                        {exp.beneficiaryName ? ` • Mua giùm ${exp.beneficiaryName}` : ''}
                      </div>
                      {exp.notes && <p className="expense-note">{exp.notes}</p>}
                      {exp.images.length > 0 && (
                        <div className="thumbs sm">
                          {exp.images.map((imgUrl, idx) => (
                            <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="thumb">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imgUrl} alt={`Hóa đơn ${idx + 1}`} />
                            </a>
                          ))}
                        </div>
                      )}
                      {!selecting && <ExpenseActions id={exp.id} hasHistory={exp.hasHistory} isSettled={exp.isSettled} />}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {selecting && selected.length > 0 && (
              <div className="bulk-bar">
                <button type="button" className="btn btn-success" disabled={isPending} onClick={() => runBulk('settle')}>
                  Đã trả
                </button>
                <button type="button" className="btn btn-secondary" disabled={isPending} onClick={() => runBulk('unsettle')}>
                  Bỏ đã trả
                </button>
                <button type="button" className="btn btn-danger" disabled={isPending} onClick={() => runBulk('delete')}>
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
