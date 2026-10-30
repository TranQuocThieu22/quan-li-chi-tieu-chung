// Chuỗi VietQR (chuẩn EMVCo của NAPAS) để app ngân hàng quét và chuyển khoản; dùng được cả ở client và server
import { stripDiacritics } from './guess-category';

const NAPAS_GUID = 'A000000727';
const TO_ACCOUNT = 'QRIBFTTA';

const tlv = (tag: string, value: string) => `${tag}${String(value.length).padStart(2, '0')}${value}`;

// CRC-16/CCITT-FALSE (poly 0x1021, khởi tạo 0xFFFF), 4 chữ số hex in hoa
export function crc16(text: string) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Nội dung chuyển khoản: app ngân hàng chỉ nhận chữ không dấu, số và khoảng trắng, nên bỏ dấu và cắt ngắn
export function transferNote(text: string) {
  return stripDiacritics(text).replace(/[^A-Za-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50).trim();
}

// bin: mã ngân hàng theo NAPAS (xem banks.ts). Có số tiền thì là mã dùng một lần (01=12), không thì mã tĩnh (01=11).
export function buildVietQr({ bin, account, amount, note }: { bin: string; account: string; amount?: number; note?: string }) {
  const value = amount && amount > 0 ? String(Math.round(amount)) : '';
  const info = note ? transferNote(note) : '';
  const payload = [
    tlv('00', '01'),
    tlv('01', value ? '12' : '11'),
    tlv('38', tlv('00', NAPAS_GUID) + tlv('01', tlv('00', bin) + tlv('01', account)) + tlv('02', TO_ACCOUNT)),
    tlv('53', '704'),
    value ? tlv('54', value) : '',
    tlv('58', 'VN'),
    value && info ? tlv('62', tlv('08', info)) : '',
    '6304',
  ].join('');
  return payload + crc16(payload);
}
