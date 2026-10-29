import { describe, expect, it } from 'vitest';
import { parseBankNotification } from './notification-parser';

// Mỗi ca là một thông báo (tiêu đề + nội dung như MacroDroid gửi lên). Thông báo thật bị đọc sai thì thêm vào đây
// trước, rồi mới sửa bộ đọc — để sửa cho ngân hàng này không làm hỏng ngân hàng khác. Che số tài khoản trước khi dán.
const CASES: { name: string; text: string; amount: number | null; direction: 'OUT' | 'IN' | null; description?: string | null }[] = [
  {
    name: 'Vietcombank — số có dấu ngay sau "Số dư TK", nội dung sau Ref',
    text: 'Biến động số dư\nSố dư TK VCB 0123456789 -1,191,000 VND lúc 29-10-2026 10:15:30. Số dư 8,234,567 VND. Ref MBVCB.1234.ABCD.Thanh toan tien dien thang 10',
    amount: 1_191_000,
    direction: 'OUT',
    description: 'Thanh toan tien dien thang 10',
  },
  {
    name: 'MB Bank — ngăn bằng |, nội dung có ngoặc kép',
    text: 'Thông báo biến động số dư\nTK 0123xxx456|GD: -85,000VND 29/10/26 10:20 |SD: 2,345,678VND|ND: GRAB*A-123 "Grab" ve que',
    amount: 85_000,
    direction: 'OUT',
    description: 'GRAB*A-123 "Grab" ve que',
  },
  {
    name: 'BIDV — nhiều dòng, nhãn có dấu',
    text: 'BIDV\nThời gian: 29/10/2026 11:00\nTài khoản: 1251\nGiao dịch: -1,150,000 VND\nSố dư hiện tại: 900,000 VND\nNội dung: Di sieu thi Coopmart',
    amount: 1_150_000,
    direction: 'OUT',
    description: 'Di sieu thi Coopmart',
  },
  {
    name: 'Techcombank — tiền vào, số tiền ở tiêu đề',
    text: '+5,000,000 VND\nTK 19031234 So du: 12,000,000 VND ND: Luong thang 10',
    amount: 5_000_000,
    direction: 'IN',
    description: 'Luong thang 10',
  },
  {
    name: 'VPBank — không dấu, nội dung sau ND',
    text: 'TK 123 tai VPB -320,000VND luc 29/10/2026 11:20. So du 4,100,000VND. ND: Thanh toan Shopee don hang 123',
    amount: 320_000,
    direction: 'OUT',
    description: 'Thanh toan Shopee don hang 123',
  },
  {
    name: 'MoMo — thanh toán ("thành công" không phải "cộng tiền")',
    text: 'Thanh toán thành công\nBạn đã thanh toán 62.000đ cho Phúc Long Coffee & Tea',
    amount: 62_000,
    direction: 'OUT',
    description: 'Phúc Long Coffee & Tea',
  },
  {
    name: 'MoMo — nhận tiền',
    text: 'Nhận tiền thành công\nBạn vừa nhận 200.000đ từ NGUYEN VAN A',
    amount: 200_000,
    direction: 'IN',
  },
  {
    name: 'MoMo — chuyển tiền có lời nhắn',
    text: 'Chuyển tiền thành công -100.000đ tới TRAN THI B. Lời nhắn: tien an trua',
    amount: 100_000,
    direction: 'OUT',
    description: 'tien an trua',
  },
  {
    name: 'OTP — không có số tiền',
    text: 'Mã OTP\nMa OTP cua ban la 123456. Khong chia se cho bat ky ai.',
    amount: null,
    direction: null,
  },
  {
    name: 'Chỉ báo số dư — không phải giao dịch',
    text: 'Số dư tài khoản 1,000,000 VND',
    amount: null,
    direction: null,
  },
  {
    name: 'Ngày tháng có dấu gạch không bị nhận là số tiền',
    text: 'Giao dịch lúc 29-10-2026 -45,000 VND tại Circle K',
    amount: 45_000,
    direction: 'OUT',
  },
];

describe('parseBankNotification', () => {
  for (const c of CASES) {
    it(c.name, () => {
      const parsed = parseBankNotification(c.text);
      expect(parsed.amount).toBe(c.amount);
      expect(parsed.direction).toBe(c.direction);
      if (c.description !== undefined) expect(parsed.description).toBe(c.description);
    });
  }
});
