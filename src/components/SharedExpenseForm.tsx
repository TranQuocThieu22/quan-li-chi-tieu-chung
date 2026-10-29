'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategoryPicker from './CategoryPicker';
import { guessSharedCategory, normalizeItemName, SHARED_CATEGORIES } from '@/lib/shared';

type Member = { id: number; name: string; isMe: boolean };
type Initial = {
  item: string;
  amount: number;
  category: string;
  payerId: number;
  isPayOnBehalf: boolean;
  date: string;
  notes: string;
  images: string[];
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const DEFAULT_CATEGORY = 'food';

// Form thêm / sửa khoản chi trong sổ chung; có expenseId là sửa.
// knownCategories: tên món đã chuẩn hoá → danh mục của khoản gần nhất cùng tên trong sổ, để gợi ý khi thêm mới.
export default function SharedExpenseForm({
  partnershipId,
  members,
  expenseId,
  initial,
  knownCategories = {},
}: {
  partnershipId: number;
  members: Member[];
  expenseId?: number;
  initial?: Initial;
  knownCategories?: Record<string, string>;
}) {
  // Gợi ý chỉ chạy khi thêm mới và người dùng chưa tự bấm chọn danh mục
  const [categoryTouched, setCategoryTouched] = useState(Boolean(expenseId));
  const [suggestion, setSuggestion] = useState<'known' | 'keyword' | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    item: initial?.item ?? '',
    amount: initial ? String(initial.amount) : '',
    category: initial?.category ?? DEFAULT_CATEGORY,
    payerId: String(initial?.payerId ?? (members.find(m => m.isMe) ?? members[0])?.id ?? ''),
    isPayOnBehalf: initial?.isPayOnBehalf ?? false,
    date: initial?.date ?? new Date().toISOString().split('T')[0],
    notes: initial?.notes ?? '',
  });
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  const displayAmount = form.amount ? new Intl.NumberFormat('vi-VN').format(parseInt(form.amount, 10)) : '';

  const changeItem = (item: string) => {
    if (categoryTouched) {
      setForm({ ...form, item });
      return;
    }
    const known = knownCategories[normalizeItemName(item)];
    const guessed = known ? null : guessSharedCategory(item);
    setSuggestion(known ? 'known' : guessed ? 'keyword' : null);
    setForm({ ...form, item, category: known ?? guessed ?? DEFAULT_CATEGORY });
  };

  const addImages = async (files: File[]) => {
    const accepted = files.filter(file => {
      if (file.size <= MAX_IMAGE_SIZE) return true;
      alert(`Ảnh ${file.name} quá lớn. Vui lòng chọn ảnh dưới 5MB.`);
      return false;
    });
    if (accepted.length === 0) return;
    try {
      const urls = await Promise.all(accepted.map(readAsDataUrl));
      setImages(prev => [...prev, ...urls]);
    } catch {
      alert('Không đọc được ảnh, vui lòng thử lại.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.payerId) return;

    // Sổ chung luôn có hai người: mua giùm thì người hưởng là người còn lại
    const beneficiary = form.isPayOnBehalf ? members.find(m => String(m.id) !== form.payerId) : undefined;

    setLoading(true);
    try {
      const res = await fetch(expenseId ? `/api/expenses/${expenseId}` : '/api/expenses', {
        method: expenseId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: form.item,
          amount: form.amount,
          category: form.category,
          payerId: form.payerId,
          beneficiaryId: beneficiary ? String(beneficiary.id) : '',
          date: form.date,
          notes: form.notes,
          imageUrl: images.length > 0 ? JSON.stringify(images) : '',
          // Cố định sổ nhận khoản chi theo lúc mở trang, không theo sổ đang chọn ở tab khác
          partnershipId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Có lỗi xảy ra khi lưu dữ liệu!');
        return;
      }
      router.push('/');
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
        <label className="label" htmlFor="item">Tên món đồ / Dịch vụ</label>
        <input
          id="item"
          type="text"
          className="input"
          placeholder="VD: Tiền điện tháng 5"
          required
          value={form.item}
          onChange={(e) => changeItem(e.target.value)}
        />
      </div>

      <CategoryPicker
        categories={SHARED_CATEGORIES}
        value={form.category}
        hint={!categoryTouched && suggestion ? (suggestion === 'known' ? 'như lần trước' : 'tự chọn theo tên món') : undefined}
        onChange={(category) => {
          setCategoryTouched(true);
          setForm({ ...form, category });
        }}
      />

      <div className="form-row">
        <div className="form-group">
          <label className="label" htmlFor="payer">Người trả</label>
          <select
            id="payer"
            className="select"
            value={form.payerId}
            onChange={(e) => setForm({ ...form, payerId: e.target.value })}
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="date">Ngày mua</label>
          <input
            id="date"
            type="date"
            className="input"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
      </div>

      <label className="check-row">
        <input
          type="checkbox"
          checked={form.isPayOnBehalf}
          onChange={(e) => setForm({ ...form, isPayOnBehalf: e.target.checked })}
        />
        Là khoản trả giùm / mua giùm
      </label>

      <div className="form-group">
        <label className="label" htmlFor="notes">Ghi chú <span className="optional">(tùy chọn)</span></label>
        <textarea
          id="notes"
          className="textarea"
          placeholder="Ghi chú thêm..."
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="images">Ảnh hóa đơn <span className="optional">(tùy chọn)</span></label>
        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          className="input input-file"
          onChange={(e) => {
            addImages(Array.from(e.target.files || []));
            e.target.value = '';
          }}
        />
        {images.length > 0 && (
          <div className="thumbs">
            {images.map((imgUrl, idx) => (
              <div key={idx} className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt={`Hóa đơn ${idx + 1}`} />
                <button
                  type="button"
                  className="thumb-remove"
                  aria-label={`Bỏ ảnh ${idx + 1}`}
                  onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit" className="btn btn-primary btn-block btn-lg mt-2" disabled={loading}>
        {loading ? 'Đang lưu...' : expenseId ? 'Lưu chỉnh sửa' : 'Lưu khoản chi'}
      </button>
    </form>
  );
}
