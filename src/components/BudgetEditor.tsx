'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const smallBtn = { width: 'auto', margin: 0, padding: '0.5rem 1rem' };

// amount: ngân sách đang áp dụng cho tháng (kể cả dùng lại từ tháng trước), null nếu chưa có
export default function BudgetEditor({ month, amount }: { month: string; amount: number | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (next: number) => {
    setSaving(true);
    try {
      const res = await fetch('/api/personal-budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, amount: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Không lưu được ngân sách');
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      alert('Lỗi kết nối!');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        className="btn btn-secondary"
        style={smallBtn}
        onClick={() => {
          setValue(amount ? String(amount) : '');
          setEditing(true);
        }}
      >
        {amount ? 'Sửa ngân sách' : 'Đặt ngân sách'}
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const next = parseInt(value, 10);
        if (next > 0) save(next);
      }}
      style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}
    >
      <input
        type="text"
        inputMode="numeric"
        className="input"
        autoFocus
        placeholder="VD: 5.000.000"
        aria-label="Ngân sách tháng"
        value={value ? new Intl.NumberFormat('vi-VN').format(parseInt(value, 10)) : ''}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
        style={{ flex: '1 1 160px', margin: 0 }}
      />
      <button type="submit" className="btn btn-primary" disabled={saving || !value} style={smallBtn}>Lưu</button>
      <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => setEditing(false)} style={smallBtn}>Hủy</button>
      {amount !== null && (
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            if (confirm('Tắt ngân sách từ tháng này trở đi?')) save(0);
          }}
          style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontWeight: 600, padding: '0.5rem' }}
        >
          Tắt ngân sách
        </button>
      )}
    </form>
  );
}
