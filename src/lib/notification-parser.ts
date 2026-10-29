// Đọc thông báo biến động số dư (app ngân hàng, MoMo) chuyển tiếp từ điện thoại.
// Mỗi ngân hàng viết một kiểu nên không khớp mẫu riêng từng nơi mà dựa vào dấu hiệu chung:
// số tiền có dấu +/- (kèm đơn vị hoặc dấu phân cách nghìn), bỏ qua số đứng sau "số dư", rồi tới từ khoá chiều tiền.
// Đọc sai thì nội dung gốc vẫn lưu ở ImportedTransaction.text để soát và chỉnh tại đây.
import { stripDiacritics } from './guess-category';

export type ParsedNotification = {
  amount: number | null;
  direction: 'OUT' | 'IN' | null;
  description: string | null;
};

// Có đơn vị (VND, đ, ₫) hoặc có dấu phân cách nghìn thì mới coi là số tiền, để "-2026" trong ngày tháng không bị nhận nhầm
const AMOUNT = String.raw`(\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{1,2})?\s?(VND|VNĐ|đ|₫|d)?(?![\p{L}\d])`;
const SIGNED_AMOUNT = new RegExp(String.raw`(^|[\s:(|])([+-])\s?` + AMOUNT, 'giu');
const ANY_AMOUNT = new RegExp(String.raw`(^|[^\d.,])` + AMOUNT, 'giu');

// Trước con số (cách tối đa ba từ) mà có những chữ này thì đó là số dư, không phải số tiền giao dịch.
// Chỉ xét với số không dấu: số dư không mang +/-, còn VCB viết "Số dư TK VCB … -150,000 VND" với số có dấu là tiền giao dịch.
const BALANCE_BEFORE = /\b(so du|sd|balance|con lai|bal)\b(\s+\S+){0,3}\s*[:=]?\s*$/i;
// Số ngay sau "lên đến", "tối đa"… là mức quảng cáo (hạn mức thẻ, hoàn tiền), không phải tiền đã đi
const PROMO_BEFORE = /\b(len den|len toi|toi da|up to)\s*$/i;
// Luật quảng cáo bắt tin quảng cáo mở đầu bằng "QC" — ACB ONE gửi "[QC] THÊM HẠN MỨC…" kèm "Hạn mức lên đến 400.000.000đ"
const AD_MARK = /\[\s*QC\s*\]|\(\s*QC\s*\)|(?:^|\n)\s*QC\s*[:\-–|]/i;

const OUT_WORDS = ['thanh toan', 'chuyen tien', 'chuyen khoan', 'da chuyen', 'tru', 'rut tien', 'chi tieu', 'giam', 'payment',
  'paid', 'debit', 'mua', 'nap tien'];
// Không có "cong" / "tang" đứng riêng: "thành công" bỏ dấu cũng ra "thanh cong", "tặng" ra "tang"
const IN_WORDS = ['nhan tien', 'nhan duoc', 'da nhan', 'vua nhan', 'cong tien', 'duoc cong', 'hoan tien', 'ghi co', 'received',
  'credit', 'refund'];

// Tìm trên bản bỏ dấu ("Nội dung:" hay "Noi dung:" đều khớp) rồi cắt ở bản gốc cùng vị trí —
// bỏ dấu tiếng Việt dạng NFC không đổi độ dài chuỗi
const DESCRIPTION = /(?:^|[\s|])(?:nd|noi dung|nd gd|mo ta|content|description|remark|loi nhan)\s*[:：]\s*(.+)$/i;
// Kiểu VCB: "Ref MBVCB.1234.ABCD.Thanh toan tien dien" — lấy phần chữ sau dãy mã
const REF_DESCRIPTION = /\bref\s+(?:[A-Za-z0-9*-]+\.)+\s*(.+)$/i;

function toNumber(digits: string) {
  const value = Number(digits.replace(/[.,]/g, ''));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function hasWord(plain: string, words: string[]) {
  return words.some(word => ` ${plain} `.includes(` ${word} `));
}

export function parseBankNotification(raw: string): ParsedNotification {
  if (AD_MARK.test(raw)) return { amount: null, direction: null, description: null };
  const text = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  // So từ khoá trên bản bỏ dấu, chữ thường, chỉ còn chữ và số — ngân hàng viết có dấu hay không đều khớp
  const plain = stripDiacritics(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  let amount: number | null = null;
  let direction: ParsedNotification['direction'] = null;

  for (const match of text.matchAll(SIGNED_AMOUNT)) {
    const [, , sign, digits, unit] = match;
    // Không đơn vị và không dấu phân cách (vd. "-2026") thì bỏ
    if (!unit && !/[.,]/.test(digits)) continue;
    amount = toNumber(digits);
    direction = sign === '-' ? 'OUT' : 'IN';
    if (amount) break;
  }

  if (!amount) {
    for (const match of text.matchAll(ANY_AMOUNT)) {
      const [, lead, digits, unit] = match;
      if (!unit) continue;
      const before = stripDiacritics(text.slice(0, match.index + lead.length)).toLowerCase();
      if (BALANCE_BEFORE.test(before) || PROMO_BEFORE.test(before)) continue;
      amount = toNumber(digits);
      if (amount) break;
    }
    if (amount) {
      // Tiền vào xét trước: "Nhận tiền ... từ chuyển khoản" có cả hai loại từ
      direction = hasWord(plain, IN_WORDS) ? 'IN' : hasWord(plain, OUT_WORDS) ? 'OUT' : null;
    }
  }

  const asciiText = stripDiacritics(text);
  const sliceAt = (match: RegExpMatchArray | null) =>
    match ? text.slice(match.index! + match[0].length - match[1].length).trim() : null;
  let description = sliceAt(asciiText.match(DESCRIPTION)) ?? sliceAt(asciiText.match(REF_DESCRIPTION));
  if (!description) {
    // Kiểu MoMo: "Bạn đã thanh toán 45.000đ cho Highlands Coffee"
    // "tai" không đi với "khoản": "tai khoan ACB: TK…" bỏ dấu là chữ "tài khoản", không phải "tại"
    description = text.match(/\b(?:cho|tới|toi|đến|den|tại|tai(?!\s+khoan))\s+(.+?)(?:[.!]\s|[.!]$|$)/iu)?.[1]?.trim() ?? null;
  }
  if (description) {
    // Bỏ phần đuôi như "Số dư ...", mã tham chiếu dài
    description = description.replace(/\s*(?:\||;)?\s*(?:số dư|so du|sd)\b.*$/iu, '').replace(/\s+/g, ' ').trim();
    description = description.slice(0, 80) || null;
  }

  return { amount, direction, description };
}
