'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategoryPicker from './CategoryPicker';
import { guessSharedCategory, SHARED_CATEGORIES } from '@/lib/shared';
import { initialSuggestion, useCategorySuggestion } from './useCategorySuggestion';
import { compressImage } from '@/lib/compress-image';

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

// Ảnh gốc được thu nhỏ trước khi lưu nên nhận được ảnh lớn; giới hạn cho ảnh giữ nguyên (không thu nhỏ được) vẫn là 5 MB
const MAX_INPUT_SIZE = 25 * 1024 * 1024;
const MAX_STORED_SIZE = 5 * 1024 * 1024;

// Điền sẵn từ một giao dịch ngân hàng / MoMo đang chờ xác nhận
// amount null: quẹt thẻ ngoại tệ (foreignAmount "22.22 USD"), người dùng tự điền số VND bị trừ
type Prefill = { importId: number; foreignAmount: string | null; description: string; amount: number | null; date: string };

const DEFAULT_CATEGORY = 'food';

// Form thêm / sửa khoản chi trong sổ chung; có expenseId là sửa.
// knownCategories: tên món đã chuẩn hoá → danh mục của khoản gần nhất cùng tên trong sổ, để gợi ý khi thêm mới.
export default function SharedExpenseForm({
  partnershipId,
  members,
  expenseId,
  initial,
  prefill,
  knownCategories = {},
}: {
  partnershipId: number;
  members: Member[];
  expenseId?: number;
  initial?: Initial;
  prefill?: Prefill;
  knownCategories?: Record<string, string>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [start] = useState(() =>
    prefill ? initialSuggestion(prefill.description, guessSharedCategory, knownCategories, DEFAULT_CATEGORY) : null,
  );
  // Gợi ý chỉ chạy khi thêm mới và người dùng chưa tự bấm chọn danh mục
  const suggestion = useCategorySuggestion({
    guess: guessSharedCategory,
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
    payerId: String(initial?.payerId ?? (members.find(m => m.isMe) ?? members[0])?.id ?? ''),
    isPayOnBehalf: initial?.isPayOnBehalf ?? false,
    date: initial?.date ?? prefill?.date ?? new Date().toISOString().split('T')[0],
    notes: initial?.notes ?? '',
  });
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [processingImages, setProcessingImages] = useState(false);

  const displayAmount = form.amount ? new Intl.NumberFormat('vi-VN').format(parseInt(form.amount, 10)) : '';

  const changeItem = (item: string) => {
    const category = suggestion.suggestFor(item);
    setForm({ ...form, item, ...(category ? { category } : {}) });
  };

  const addImages = async (files: File[]) => {
    const accepted = files.filter(file => {
      if (file.size <= MAX_INPUT_SIZE) return true;
      alert(`Ảnh ${file.name} quá lớn. Vui lòng chọn ảnh dưới 25MB.`);
      return false;
    });
    if (accepted.length === 0) return;
    setProcessingImages(true);
    try {
      const urls = await Promise.all(accepted.map(compressImage));
      // Độ dài data URL base64 ≈ 4/3 số byte
      const kept = urls.filter((url, i) => {
        if (url.length * 0.75 <= MAX_STORED_SIZE) return true;
        alert(`Ảnh ${accepted[i].name} không thu nhỏ được và lớn hơn 5MB.`);
        return false;
      });
      setImages(prev => [...prev, ...kept]);
    } catch {
      alert('Không đọc được ảnh, vui lòng thử lại.');
    } finally {
      setProcessingImages(false);
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
          importId: prefill?.importId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Có lỗi xảy ra khi lưu dữ liệu!');
        return;
      }
      // Xác nhận từ hộp chờ thì quay lại đó để làm tiếp các giao dịch còn lại
      router.push(prefill ? '/inbox' : '/');
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
        <label className="label" htmlFor="item">Tên món đồ / Dịch vụ</label>
        <input
          id="item"
          type="text"
          className="input"
          placeholder="VD: Tiền điện tháng 5"
          required
          autoFocus={!!prefill?.amount}
          value={form.item}
          onChange={(e) => changeItem(e.target.value)}
        />
        {prefill?.description && <p className="field-note">Từ thông báo: {prefill.description}</p>}
      </div>

      <CategoryPicker
        categories={SHARED_CATEGORIES}
        value={form.category}
        hint={suggestion.hint}
        onChange={(category) => {
          suggestion.markTouched();
          setForm({ ...form, category });
        }}
      />

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

      <button type="submit" className="btn btn-primary btn-block btn-lg mt-2" disabled={loading || processingImages}>
        {processingImages ? 'Đang xử lý ảnh...' : loading ? 'Đang lưu...' : expenseId ? 'Lưu chỉnh sửa' : 'Lưu khoản chi'}
      </button>
    </form>
  );
}
