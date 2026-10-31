'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// amount: ngân sách đang áp dụng cho tháng (kể cả dùng lại từ tháng trước), null nếu chưa có.
// Mặc định là ngân sách cá nhân; có partnershipId thì là ngân sách của sổ chung đó.
export default function BudgetEditor({
  month,
  amount,
  partnershipId,
}: {
  month: string;
  amount: number | null;
  partnershipId?: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (next: number) => {
    setSaving(true);
    try {
      const res = await fetch(partnershipId ? '/api/shared-budget' : '/api/personal-budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, amount: next, partnershipId }),
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
        className="text-btn"
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
      style={{ width: '100%' }}
    >
      <div className="inline-form">
        <input
          type="text"
          inputMode="numeric"
          className="input"
          autoFocus
          placeholder="VD: 5.000.000"
          aria-label="Ngân sách tháng"
          value={value ? new Intl.NumberFormat('vi-VN').format(parseInt(value, 10)) : ''}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
        />
        <button type="submit" className="btn btn-primary" disabled={saving || !value}>Lưu</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <button type="button" className="text-btn" style={{ color: 'var(--text-secondary)' }} disabled={saving} onClick={() => setEditing(false)}>
          Hủy
        </button>
        {amount !== null && (
          <button
            type="button"
            className="text-btn danger"
            disabled={saving}
            onClick={() => {
              if (confirm('Tắt ngân sách từ tháng này trở đi?')) save(0);
            }}
          >
            Tắt ngân sách
          </button>
        )}
      </div>
    </form>
  );
}
