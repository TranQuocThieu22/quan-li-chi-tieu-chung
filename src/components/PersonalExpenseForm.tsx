'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PERSONAL_CATEGORIES } from '@/lib/personal';

type Initial = { item: string; amount: number; category: string; date: string; notes: string };

export default function PersonalExpenseForm({ expenseId, initial }: { expenseId?: number; initial?: Initial }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    item: initial?.item ?? '',
    amount: initial ? String(initial.amount) : '',
    category: initial?.category ?? 'food',
    date: initial?.date ?? new Date().toISOString().split('T')[0],
    notes: initial?.notes ?? '',
  });

  const displayAmount = form.amount ? new Intl.NumberFormat('vi-VN').format(parseInt(form.amount, 10)) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(expenseId ? `/api/personal-expenses/${expenseId}` : '/api/personal-expenses', {
        method: expenseId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Có lỗi xảy ra khi lưu dữ liệu!');
        return;
      }
      router.push(`/personal?month=${form.date.slice(0, 7)}`);
      router.refresh();
    } catch {
      alert('Lỗi kết nối!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="label" htmlFor="amount">Số tiền (VNĐ)</label>
        <input
          id="amount"
          type="text"
          inputMode="numeric"
          className="input input-amount"
          placeholder="0"
          required
          autoFocus={!expenseId}
          value={displayAmount}
          onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, '') })}
        />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="item">Nội dung</label>
        <input
          id="item"
          type="text"
          className="input"
          placeholder="VD: Cà phê sáng"
          required
          value={form.item}
          onChange={(e) => setForm({ ...form, item: e.target.value })}
        />
      </div>

      <div className="form-group">
        <span className="label">Danh mục</span>
        <div className="option-grid">
          {PERSONAL_CATEGORIES.map(c => (
            <button
              key={c.key}
              type="button"
              className="option-btn"
              aria-pressed={form.category === c.key}
              onClick={() => setForm({ ...form, category: c.key })}
            >
              <span className="emoji" aria-hidden>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="date">Ngày</label>
        <input
          id="date"
          type="date"
          className="input"
          required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="notes">Ghi chú <span className="optional">(tùy chọn)</span></label>
        <textarea
          id="notes"
          className="textarea"
          rows={2}
          placeholder="Ghi chú thêm..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <button type="submit" className="btn btn-primary btn-block btn-lg mt-2" disabled={loading}>
        {loading ? 'Đang lưu...' : expenseId ? 'Lưu chỉnh sửa' : 'Lưu khoản chi'}
      </button>
    </form>
  );
}
