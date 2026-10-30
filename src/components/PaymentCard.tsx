import QRCode from 'qrcode';
import CopyButton from './CopyButton';
import { findBank } from '@/lib/banks';
import { buildVietQr, transferNote } from '@/lib/vietqr';

type Profile = { bankBin: string | null; bankAccount: string | null; accountName: string | null; qrImage: string | null };

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// Thông tin chuyển khoản cho một người: mã VietQR tạo ở server (điền sẵn số tiền, nội dung nếu có),
// số tài khoản để chép, và ảnh mã QR người đó tự tải lên (MoMo, ví khác…)
export default async function PaymentCard({ profile, amount, note }: { profile: Profile; amount?: number; note?: string }) {
  const bank = findBank(profile.bankBin);
  const account = bank && profile.bankAccount ? profile.bankAccount : null;
  const svg = account
    ? await QRCode.toString(buildVietQr({ bin: bank!.bin, account, amount, note }), {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      })
    : null;
  const info = note ? transferNote(note) : '';

  return (
    <div className="pay-card">
      {svg ? (
        <div className="pay-qr" role="img" aria-label="Mã VietQR" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : profile.qrImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pay-qr" src={profile.qrImage} alt="Mã QR nhận tiền" />
      ) : null}
      {svg && (
        <p className="field-note text-center">
          Mở app ngân hàng → Quét QR{amount ? ': số tiền và nội dung đã điền sẵn' : ''}.
        </p>
      )}

      {account && (
        <ul className="row-list pay-info">
          <li className="row">
            <span className="row-label">Ngân hàng</span>
            <span className="row-value">{bank!.name}</span>
          </li>
          <li className="row">
            <span className="row-label">Số tài khoản</span>
            <span className="row-value num">
              {account} <CopyButton value={account} />
            </span>
          </li>
          {profile.accountName && (
            <li className="row">
              <span className="row-label">Chủ tài khoản</span>
              <span className="row-value">{profile.accountName}</span>
            </li>
          )}
          {amount ? (
            <li className="row">
              <span className="row-label">Số tiền</span>
              <span className="row-value num">
                {formatMoney(Math.round(amount))} <CopyButton value={String(Math.round(amount))} />
              </span>
            </li>
          ) : null}
          {info && (
            <li className="row">
              <span className="row-label">Nội dung</span>
              <span className="row-value">{info}</span>
            </li>
          )}
        </ul>
      )}

      {svg && profile.qrImage && (
        <details className="pay-more">
          <summary>Mã QR khác (MoMo, ví…)</summary>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pay-qr" src={profile.qrImage} alt="Mã QR nhận tiền khác" />
        </details>
      )}
    </div>
  );
}
