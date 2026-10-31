'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PERSONAL_CATEGORIES } from '@/lib/personal';

// Mỗi danh mục một ô số tiền; để trống là không đặt (tắt nếu trước đó có). Chỉ gửi danh mục đã thay đổi.
export default function CategoryBudgetForm({ month, initial }: { month: string; initial: Record<string, number> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(PERSONAL_CATEGORIES.map(c => [c.key, initial[c.key] ? String(initial[c.key]) : ''])),
  );
  const [saving, setSaving] = useState(false);

  const changed = PERSONAL_CATEGORIES.filter(c => (parseInt(values[c.key], 10) || 0) !== (initial[c.key] ?? 0));
  const total = PERSONAL_CATEGORIES.reduce((sum, c) => sum + (parseInt(values[c.key], 10) || 0), 0);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/personal-budget/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          budgets: Object.fromEntries(changed.map(c => [c.key, parseInt(values[c.key], 10) || 0])),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Không lưu được ngân sách');
        return;
      }
      router.push(`/personal?month=${month}`);
      router.refresh();
    } catch {
      alert('Lỗi kết nối!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {PERSONAL_CATEGORIES.map(c => (
        <div key={c.key} className="form-group">
          <label className="label" htmlFor={`budget-${c.key}`}>{c.icon} {c.label}</label>
          <input
            id={`budget-${c.key}`}
            type="text"
            inputMode="numeric"
            className="input"
            placeholder="Không đặt"
            value={values[c.key] ? new Intl.NumberFormat('vi-VN').format(parseInt(values[c.key], 10)) : ''}
            onChange={(e) => setValues({ ...values, [c.key]: e.target.value.replace(/\D/g, '') })}
          />
        </div>
      ))}
      <p className="field-note" style={{ marginBottom: '1rem' }}>
        Tổng các danh mục: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}. Danh mục để
        trống thì không giới hạn; trang chủ và trang Cá nhân nhắc khi một danh mục dùng từ 80%.
      </p>
      <button type="submit" className="btn btn-primary btn-block" disabled={saving || changed.length === 0}>
        {saving ? 'Đang lưu...' : changed.length > 0 ? `Lưu (${changed.length} danh mục)` : 'Chưa thay đổi'}
      </button>
    </form>
  );
}
