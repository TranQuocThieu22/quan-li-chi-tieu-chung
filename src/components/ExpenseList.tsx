'use client';
import { useState, useSyncExternalStore, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ExpenseActions from './ExpenseActions';
import { CheckIcon } from './icons';
import { getSharedCategory } from '@/lib/shared';

export type ExpenseListItem = {
  id: number;
  item: string;
  amount: number;
  category: string;
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

// Bộ lọc nhớ theo từng máy; server luôn render "Tất cả" rồi client đổi sang lựa chọn đã lưu
type Filter = 'all' | 'unpaid' | 'paid';
const FILTERS: Filter[] = ['all', 'unpaid', 'paid'];
const FILTER_KEY = 'shared-expense-filter';
const FILTER_EVENT = 'shared-expense-filter-change';
let memoryFilter: Filter = 'all';

function readFilter(): Filter {
  try {
    const stored = localStorage.getItem(FILTER_KEY) as Filter | null;
    if (stored && FILTERS.includes(stored)) return stored;
  } catch {}
  return memoryFilter;
}

function writeFilter(value: Filter) {
  memoryFilter = value;
  try {
    localStorage.setItem(FILTER_KEY, value);
  } catch {}
  window.dispatchEvent(new Event(FILTER_EVENT));
}

function subscribeFilter(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(FILTER_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(FILTER_EVENT, onChange);
  };
}

const sum = (items: ExpenseListItem[]) => items.reduce((total, e) => total + e.amount, 0);

export default function ExpenseList({ expenses }: { expenses: ExpenseListItem[] }) {
  const router = useRouter();
  const filter = useSyncExternalStore(subscribeFilter, readFilter, () => 'all' as Filter);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const unpaid = expenses.filter(e => !e.isSettled);
  const paid = expenses.filter(e => e.isSettled);
  const groups = [
    { key: 'unpaid', label: 'Chưa trả', items: unpaid, show: filter !== 'paid' },
    { key: 'paid', label: 'Đã trả', items: paid, show: filter !== 'unpaid' },
  ].filter(g => g.show && g.items.length > 0);
  const visible = groups.flatMap(g => g.items);

  // Chỉ thao tác trên những khoản đang hiện theo bộ lọc
  const selected = selectedIds.filter(id => visible.some(e => e.id === id));
  const allSelected = visible.length > 0 && selected.length === visible.length;
  const selectedTotal = sum(visible.filter(e => selected.includes(e.id)));

  const toggleSelecting = () => {
    setSelecting(!selecting);
    setSelectedIds([]);
  };

  const toggleOne = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : visible.map(e => e.id));
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

  const filterOptions: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'Tất cả', count: expenses.length },
    { value: 'unpaid', label: 'Chưa trả', count: unpaid.length },
    { value: 'paid', label: 'Đã trả', count: paid.length },
  ];

  const emptyText =
    expenses.length === 0 ? 'Chưa có khoản chi nào trong tháng này.'
    : filter === 'unpaid' ? 'Đã trả hết, không còn khoản nào chưa trả.'
    : 'Chưa có khoản nào được đánh dấu đã trả.';

  return (
    <>
      <div className="section-head">
        <h2 className="section-title">Lịch sử chi tiêu</h2>
        {visible.length > 0 && (
          <button type="button" onClick={toggleSelecting} className="btn btn-ghost btn-sm">
            {selecting ? 'Xong' : 'Chọn nhiều'}
          </button>
        )}
      </div>

      {expenses.length > 0 && (
        <div className="segmented" role="group" aria-label="Lọc theo trạng thái">
          {filterOptions.map(o => (
            <button key={o.value} type="button" aria-pressed={filter === o.value} onClick={() => writeFilter(o.value)}>
              {o.label}
              <span className="count">{o.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="card">
        {visible.length === 0 ? (
          <p className="empty">{emptyText}</p>
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
                  Chọn tất cả ({visible.length})
                </label>
                <span className="text-muted">
                  {selected.length} khoản • <span className="num">{formatMoney(selectedTotal)}</span>
                </span>
              </div>
            )}

            {groups.map(group => (
              <div key={group.key} className="expense-group">
                <div className={`group-head ${group.key}`}>
                  <span><span className="dot" aria-hidden />{group.label} • {group.items.length} khoản</span>
                  <span className="num">{formatMoney(sum(group.items))}</span>
                </div>
                <ul className="expense-list">
                  {group.items.map(exp => {
                    const category = getSharedCategory(exp.category);
                    return (
                      <li key={exp.id} className={`expense-item${exp.isSettled ? ' settled' : ''}`}>
                        <div className="expense-row">
                          {selecting ? (
                            <input
                              type="checkbox"
                              aria-label={`Chọn ${exp.item}`}
                              checked={selected.includes(exp.id)}
                              onChange={() => toggleOne(exp.id)}
                            />
                          ) : (
                            <div className="avatar-wrap">
                              <div className="avatar emoji" title={category.label} aria-hidden>{category.icon}</div>
                              {exp.isSettled && (
                                <span className="avatar-check" aria-hidden><CheckIcon /></span>
                              )}
                            </div>
                          )}
                          <div className="expense-body">
                            <div className="expense-dim">
                              <div className="expense-top">
                                <div className="expense-title">{exp.item}</div>
                                <div className={`expense-amount${exp.isSettled ? ' settled' : ''}`}>
                                  {formatMoney(exp.amount)}
                                </div>
                              </div>
                              <div className="expense-meta">
                                {new Date(exp.date).toLocaleDateString('vi-VN')} • {category.label} • {exp.payerName} trả
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
                            </div>
                            {!selecting && <ExpenseActions id={exp.id} hasHistory={exp.hasHistory} isSettled={exp.isSettled} />}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

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
