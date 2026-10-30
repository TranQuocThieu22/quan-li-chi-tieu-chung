'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { guessPersonalCategory, PERSONAL_CATEGORIES } from '@/lib/personal';
import CategoryPicker from './CategoryPicker';
import { initialSuggestion, useCategorySuggestion } from './useCategorySuggestion';

type Initial = { item: string; amount: number; category: string; date: string; notes: string };
// Điền sẵn từ một giao dịch ngân hàng / MoMo đang chờ xác nhận
// amount null: quẹt thẻ ngoại tệ (foreignAmount "22.22 USD"), người dùng tự điền số VND bị trừ
type Prefill = { importId: number; foreignAmount: string | null; description: string; amount: number | null; date: string };

const DEFAULT_CATEGORY = 'food';

// Có expenseId là sửa. knownCategories: tên món đã chuẩn hoá → danh mục của khoản gần nhất cùng tên, để gợi ý khi thêm mới.
export default function PersonalExpenseForm({
  expenseId,
  initial,
  prefill,
  knownCategories = {},
}: {
  expenseId?: number;
  initial?: Initial;
  prefill?: Prefill;
  knownCategories?: Record<string, string>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [start] = useState(() =>
    prefill ? initialSuggestion(prefill.description, guessPersonalCategory, knownCategories, DEFAULT_CATEGORY) : null,
  );
  const suggestion = useCategorySuggestion({
    guess: guessPersonalCategory,
    knownCategories,
    // Tên gõ vào không đoán được thì giữ danh mục đoán từ nội dung thông báo
    fallback: start?.category ?? DEFAULT_CATEGORY,
    enabled: !expenseId,
    initialSource: start?.source ?? null,
  });
  const [form, setForm] = useState({
    item: initial?.item ?? '',
    amount: initial ? String(initial.amount) : prefill?.amount ? String(prefill.amount) : '',
    category: initial?.category ?? start?.category ?? DEFAULT_CATEGORY,
    date: initial?.date ?? prefill?.date ?? new Date().toISOString().split('T')[0],
    notes: initial?.notes ?? '',
  });

  const displayAmount = form.amount ? new Intl.NumberFormat('vi-VN').format(parseInt(form.amount, 10)) : '';

  const changeItem = (item: string) => {
    const category = suggestion.suggestFor(item);
    setForm({ ...form, item, ...(category ? { category } : {}) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(expenseId ? `/api/personal-expenses/${expenseId}` : '/api/personal-expenses', {
        method: expenseId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, importId: prefill?.importId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Có lỗi xảy ra khi lưu dữ liệu!');
        return;
      }
      // Xác nhận từ hộp chờ thì quay lại đó để làm tiếp các giao dịch còn lại
      router.push(prefill ? '/inbox' : `/personal?month=${form.date.slice(0, 7)}`);
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
          autoFocus={!expenseId && !prefill?.amount}
          value={displayAmount}
          onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, '') })}
        />
        {prefill?.foreignAmount && (
          <p className="field-note">Thẻ trả {prefill.foreignAmount} — nhập số tiền VND bị trừ (xem app ngân hàng).</p>
        )}
      </div>

      <div className="form-group">
        <label className="label" htmlFor="item">Nội dung</label>
        <input
          id="item"
          type="text"
          className="input"
          placeholder="VD: Cà phê sáng"
          required
          autoFocus={!!prefill?.amount}
          value={form.item}
          onChange={(e) => changeItem(e.target.value)}
        />
        {prefill?.description && <p className="field-note">Từ thông báo: {prefill.description}</p>}
      </div>

      <CategoryPicker
        categories={PERSONAL_CATEGORIES}
        value={form.category}
        hint={suggestion.hint}
        onChange={(category) => {
          suggestion.markTouched();
          setForm({ ...form, category });
        }}
      />

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
