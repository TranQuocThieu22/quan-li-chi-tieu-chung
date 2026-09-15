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
        <label className="label">Số tiền (VNĐ)</label>
        <input
          type="text"
          inputMode="numeric"
          className="input"
          placeholder="VD: 50.000"
          required
          autoFocus={!expenseId}
          value={displayAmount}
          onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, '') })}
        />
      </div>

      <div className="form-group">
        <label className="label">Nội dung</label>
        <input
          type="text"
          className="input"
          placeholder="VD: Cà phê sáng"
          required
          value={form.item}
          onChange={(e) => setForm({ ...form, item: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="label">Danh mục</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem' }}>
          {PERSONAL_CATEGORIES.map(c => {
            const selected = form.category === c.key;
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setForm({ ...form, category: c.key })}
                style={{
                  padding: '0.6rem 0.5rem',
                  borderRadius: '8px',
                  border: `1px solid ${selected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  background: selected ? 'var(--primary-color)' : 'transparent',
                  color: selected ? '#fff' : 'var(--text-primary)',
                  fontWeight: selected ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {c.icon} {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-group">
        <label className="label">Ngày</label>
        <input
          type="date"
          className="input"
          required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="label">Ghi chú (Tùy chọn)</label>
        <textarea
          className="textarea"
          rows={3}
          placeholder="Ghi chú thêm..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
        {loading ? 'Đang lưu...' : expenseId ? 'Lưu chỉnh sửa' : 'Lưu khoản chi'}
      </button>
    </form>
  );
}
