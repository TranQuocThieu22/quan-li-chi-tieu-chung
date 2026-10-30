'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSharedCategory, SHARED_CATEGORIES } from '@/lib/shared';

type Row = { id: number; item: string; amount: number; date: string; payerName: string; proposed: string | null };

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// Mỗi khoản một ô chọn danh mục, đặt sẵn danh mục đề xuất; để "Khác" là không đổi. Lưu bằng API đổi danh mục hàng loạt
// (ghi lịch sử như khi đổi tay), mỗi danh mục một lần gọi.
export default function RecategorizeForm({ rows, doneCookie }: { rows: Row[]; doneCookie: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [choices, setChoices] = useState<Record<number, string>>(() =>
    Object.fromEntries(rows.map(r => [r.id, r.proposed ?? 'other'])),
  );

  const changes = rows.filter(r => choices[r.id] !== 'other');
  const guessed = rows.filter(r => r.proposed);
  const unguessed = rows.filter(r => !r.proposed);

  const save = async () => {
    const byCategory = new Map<string, number[]>();
    for (const r of changes) byCategory.set(choices[r.id], [...(byCategory.get(choices[r.id]) ?? []), r.id]);

    setLoading(true);
    try {
      for (const [category, ids] of byCategory) {
        const res = await fetch('/api/expenses/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'category', ids, category }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || 'Có lỗi xảy ra khi lưu danh mục!');
          router.refresh();
          return;
        }
      }
      // Để trang chủ thôi nhắc các khoản người dùng chọn để nguyên "Khác"
      document.cookie = `${doneCookie}=1; path=/; max-age=31536000; samesite=lax`;
      router.push('/');
      router.refresh();
    } catch {
      alert('Lỗi kết nối!');
    } finally {
      setLoading(false);
    }
  };

  const list = (items: Row[]) => (
    <ul className="expense-list">
      {items.map(r => {
        const category = getSharedCategory(choices[r.id]);
        return (
          <li key={r.id} className="expense-item">
            <div className="expense-row">
              <div className="avatar emoji" aria-hidden>{category.icon}</div>
              <div className="expense-body">
                <div className="expense-top">
                  <div className="expense-title">{r.item}</div>
                  <div className="expense-amount">{formatMoney(r.amount)}</div>
                </div>
                <div className="expense-meta">
                  {new Date(r.date).toLocaleDateString('vi-VN')} • {r.payerName} trả
                </div>
                <select
                  className="select select-compact"
                  aria-label={`Danh mục cho ${r.item}`}
                  value={choices[r.id]}
                  onChange={(e) => setChoices({ ...choices, [r.id]: e.target.value })}
                >
                  {SHARED_CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>
                      {c.icon} {c.key === 'other' ? 'Khác (để nguyên)' : c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {guessed.length > 0 && (
        <section className="card">
          <div className="card-title">Đề xuất theo tên món ({guessed.length}) — sai thì chọn lại</div>
          {list(guessed)}
        </section>
      )}

      {unguessed.length > 0 && (
        <section className="card">
          <div className="card-title">Chưa đoán được ({unguessed.length}) — chọn nếu muốn, không thì để Khác</div>
          {list(unguessed)}
        </section>
      )}

      <button
        type="button"
        className="btn btn-primary btn-block btn-lg"
        disabled={loading || changes.length === 0}
        onClick={save}
      >
        {loading ? 'Đang lưu...' : changes.length > 0 ? `Lưu danh mục cho ${changes.length} khoản` : 'Chưa chọn danh mục nào'}
      </button>
    </>
  );
}
