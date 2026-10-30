'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BANKS } from '@/lib/banks';
import { compressImage } from '@/lib/compress-image';

type Initial = { bankBin: string; bankAccount: string; accountName: string; qrImage: string };

const MAX_INPUT_SIZE = 25 * 1024 * 1024;

// Nhập tài khoản nhận tiền của mình; ảnh QR tự tải lên (MoMo, ví khác) là tùy chọn
export default function PaymentSetup({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const hasSaved = Boolean(initial.bankAccount || initial.qrImage);

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_INPUT_SIZE) {
      alert('Ảnh quá lớn. Vui lòng chọn ảnh dưới 25MB.');
      return;
    }
    setBusy(true);
    try {
      setForm(f => ({ ...f, qrImage: '' }));
      const url = await compressImage(file);
      setForm(f => ({ ...f, qrImage: url }));
    } catch {
      alert('Không đọc được ảnh, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const save = async (data: Initial, done: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/payment-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: body.error || 'Không lưu được, vui lòng thử lại.' });
        return;
      }
      setMessage({ type: 'success', text: done });
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối!' });
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    if (!confirm('Xoá thông tin nhận tiền? Người cùng sổ sẽ không thấy mã QR của bạn nữa.')) return;
    const empty = { bankBin: '', bankAccount: '', accountName: '', qrImage: '' };
    setForm(empty);
    save(empty, 'Đã xoá thông tin nhận tiền.');
  };

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        save(form, 'Đã lưu. Người cùng sổ sẽ thấy mã QR ở thẻ “Cần thanh toán”.');
      }}
    >
      {message && (
        <div className={`notice ${message.type === 'error' ? 'notice-error' : 'notice-success'}`}>{message.text}</div>
      )}

      <div className="form-group">
        <label className="label" htmlFor="bank">Ngân hàng / ví</label>
        <select
          id="bank"
          className="select"
          value={form.bankBin}
          onChange={(e) => setForm({ ...form, bankBin: e.target.value })}
        >
          <option value="">Chọn ngân hàng…</option>
          {BANKS.map(b => (
            <option key={b.bin} value={b.bin}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="account">Số tài khoản</label>
        <input
          id="account"
          className="input"
          inputMode="numeric"
          autoComplete="off"
          placeholder="VD: 0123456789"
          value={form.bankAccount}
          onChange={(e) => setForm({ ...form, bankAccount: e.target.value.replace(/\s+/g, '') })}
        />
        <p className="field-note">
          App tự tạo mã VietQR kèm số tiền cần trả — người cùng sổ quét bằng app ngân hàng bất kỳ. MoMo, ZaloPay: chọn ví và
          nhập số điện thoại.
        </p>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="account-name">Chủ tài khoản <span className="optional">(tùy chọn)</span></label>
        <input
          id="account-name"
          className="input"
          autoComplete="off"
          placeholder="NGUYEN VAN A"
          value={form.accountName}
          onChange={(e) => setForm({ ...form, accountName: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="qr-image">Ảnh mã QR của bạn <span className="optional">(tùy chọn)</span></label>
        <input
          id="qr-image"
          type="file"
          accept="image/*"
          className="input input-file"
          onChange={(e) => {
            pickImage(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <p className="field-note">Mã QR có sẵn trong app MoMo, ngân hàng… — hiện thêm bên dưới mã VietQR.</p>
        {form.qrImage && (
          <div className="thumbs">
            <div className="thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.qrImage} alt="Mã QR đã chọn" />
              <button
                type="button"
                className="thumb-remove"
                aria-label="Bỏ ảnh mã QR"
                onClick={() => setForm({ ...form, qrImage: '' })}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? 'Đang lưu...' : 'Lưu'}
      </button>
      {hasSaved && (
        <button type="button" className="btn btn-danger-soft btn-block mt-2" disabled={busy} onClick={clear}>
          Xoá thông tin nhận tiền
        </button>
      )}
    </form>
  );
}
