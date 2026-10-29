'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Mẫu nội dung cho hành động HTTP Request của MacroDroid: mỗi dòng "khoá=magic text".
// Dạng này chịu được dấu ngoặc kép và xuống dòng trong thông báo, thứ làm hỏng JSON ghép tay.
const BODY_TEMPLATE = ['app={not_app_name}', 'title={not_title}', 'text={notification}', 'big={not_text_big}', 'time={not_timestamp}'].join('\n');

const SAMPLE = [
  'app=MoMo',
  'title=Thanh toán thành công',
  'text=Bạn đã thanh toán 45.000đ cho Highlands Coffee (thử từ trang cài đặt)',
  `time=${Date.now()}`,
].join('\n');

function CopyField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Không chép được, hãy chọn và chép tay.');
    }
  };
  return (
    <div className="form-group">
      <div className="card-head" style={{ marginBottom: '0.375rem' }}>
        <span className="label" style={{ margin: 0 }}>{label}</span>
        <button type="button" className="text-btn" onClick={copy}>{copied ? 'Đã chép ✓' : 'Chép'}</button>
      </div>
      {multiline
        ? <textarea className="textarea copy-field" readOnly rows={5} value={value} onFocus={e => e.target.select()} />
        : <input className="input copy-field" readOnly value={value} onFocus={e => e.target.select()} />}
    </div>
  );
}

export default function ImportSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const url = token ? `${window.location.origin}/api/import/notify?key=${token}` : '';

  const createToken = async () => {
    if (enabled && !confirm('Tạo mã mới? Mã cũ đang cài trên điện thoại sẽ ngừng hoạt động.')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/import/token', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToken(data.token);
      setTestResult(null);
      router.refresh();
    } catch {
      alert('Không tạo được mã');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!confirm('Tắt tự động nhập? Điện thoại sẽ không gửi được giao dịch về nữa.')) return;
    setBusy(true);
    try {
      await fetch('/api/import/token', { method: 'DELETE' });
      setToken(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setTestResult(null);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: SAMPLE });
      const data = await res.json().catch(() => ({}));
      setTestResult(res.ok
        ? data.duplicate ? 'Đã nhận rồi (gửi trùng trong 2 phút).' : 'Đã nhận ✓ — xem ở trang Chờ xác nhận.'
        : `Lỗi: ${data.error ?? res.status}`);
      router.refresh();
    } catch {
      setTestResult('Lỗi kết nối');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="card">
        <div className="card-head">
          <div className="card-title">Mã nhận thông báo</div>
          <span className={`badge ${enabled ? 'badge-success' : ''}`}>{enabled ? 'Đang bật' : 'Chưa bật'}</span>
        </div>

        {token ? (
          <>
            <p className="notice notice-success">Chép hai mục dưới vào MacroDroid ngay — địa chỉ chỉ hiện một lần.</p>
            <CopyField label="Địa chỉ (URL)" value={url} />
            <CopyField label="Nội dung (Content body)" value={BODY_TEMPLATE} multiline />
            <div className="inline-form">
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={sendTest}>Gửi thử một giao dịch mẫu</button>
            </div>
            {testResult && <p className="text-sm mt-2">{testResult}</p>}
          </>
        ) : (
          <p className="text-muted text-sm" style={{ marginBottom: '0.75rem' }}>
            {enabled
              ? 'Điện thoại đã được cài. Mất địa chỉ hay đổi máy thì tạo mã mới (mã cũ ngừng hoạt động).'
              : 'Tạo mã để điện thoại Android gửi thông báo của app ngân hàng, MoMo về đây.'}
          </p>
        )}

        <div className="inline-form mt-2">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={createToken}>
            {enabled ? 'Tạo mã mới' : 'Bật và tạo mã'}
          </button>
          {enabled && <button type="button" className="btn btn-danger-soft" disabled={busy} onClick={disable}>Tắt</button>}
        </div>
      </section>

      <section className="card">
        <div className="card-title">Cài trên điện thoại Android (MacroDroid)</div>
        <ol className="steps">
          <li>Cài <strong>MacroDroid</strong> từ Google Play (bản miễn phí đủ dùng) và mở app.</li>
          <li>
            Bấm <strong>Thêm macro</strong> → <strong>Trình kích hoạt</strong> (Triggers) → <em>Sự kiện thiết bị</em> →{' '}
            <strong>Thông báo</strong> → <strong>Thông báo nhận được</strong>. Chọn các app ngân hàng và MoMo, nội dung để
            <em> Bất kỳ</em>. Cho phép MacroDroid <strong>truy cập thông báo</strong> khi được hỏi.
          </li>
          <li>
            <strong>Hành động</strong> (Actions) → <em>Tương tác web</em> → <strong>Yêu cầu HTTP</strong> (HTTP Request):
            phương thức <strong>POST</strong>, dán <strong>Địa chỉ</strong> ở trên; ở phần <em>Nội dung</em> (Content body)
            chọn kiểu <strong>text/plain</strong> rồi dán <strong>Nội dung</strong> ở trên.
          </li>
          <li>Lưu macro. Thử bằng một giao dịch nhỏ (vd. chuyển 1.000đ) — nó sẽ hiện ở <strong>Chờ xác nhận</strong>.</li>
          <li>
            Máy Xiaomi, Oppo, Samsung… hay tắt app chạy nền: vào cài đặt pin, đặt MacroDroid là <strong>Không tối ưu</strong>.
          </li>
        </ol>
        <p className="text-muted text-sm mt-2">
          iPhone không cho app đọc thông báo của app khác, nên chưa dùng được cách này. Tiền vào (nhận lương, được chuyển
          trả) tự bỏ qua; mã OTP và thông báo không có số tiền thì không vào hộp chờ.
        </p>
      </section>
    </>
  );
}
