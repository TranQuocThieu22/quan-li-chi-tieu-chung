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
  {
    name: 'ACB ONE — quảng cáo [QC] có số tiền hạn mức (29/10, thông báo thật)',
    text: '[QC] THÊM HẠN MỨC – THÊM CHỦ ĐỘNG\nTừ những khoản chi hằng ngày đến kế hoạch lớn, thẻ tín dụng ACB giúp bạn chủ động hơn với:\n💳 Hạn mức lên đến 400.000.000đ\n✨ X3 điểm ACB Rewards trong 3 tháng đầu mở thẻ\n🛍️ Trả góp 0% lãi suất, kỳ hạn từ 3–36 tháng\nMở thẻ để sẵn sàng cho mọi kế hoạch!',
    amount: null,
    direction: null,
  },
  {
    name: 'Quảng cáo không gắn QC — số sau "lên đến" không phải giao dịch',
    text: 'Ưu đãi tháng 11\nMở thẻ tín dụng ngay, hạn mức lên đến 200.000.000đ, hoàn tiền tới 10%',
    amount: null,
    direction: null,
  },
  {
    name: 'ACB ONE — chuyển khoản, nội dung sau "GD:", bỏ đuôi ngày giờ và mã (29/10, thông báo thật)',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 1234xxxx(VND) - 50,000 luc 22:41 29/10/2026. So du 337,423. GD: NGUYEN VAN A CHUYEN KHOAN-291026-22:41:57 6302ASCB02ABCD12',
    amount: 50_000,
    direction: 'OUT',
    description: 'NGUYEN VAN A CHUYEN KHOAN',
  },
  {
    name: 'ACB ONE — tiền vào',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 1234xxxx(VND) + 1,200,000 luc 09:05 30/10/2026. So du 1,537,423. GD: TRAN THI B tra tien an',
    amount: 1_200_000,
    direction: 'IN',
    description: 'TRAN THI B tra tien an',
  },
  // Mẫu thật ACB ONE gửi 30/10 (ảnh chụp mục Giao dịch, 28–30/10); đã thay số tài khoản, họ tên, số điện thoại, mã QR
  {
    name: 'ACB ONE — nạp tiền điện thoại, bỏ "IB" đầu nội dung',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 1234xxxx(VND) - 100,000 luc 12:11 28/10/2026. So du 296,178. GD: IB NAP TIEN DIEN THOAI DI DONG TRA TRUOC CHO 0901234567',
    amount: 100_000,
    direction: 'OUT',
    description: 'NAP TIEN DIEN THOAI DI DONG TRA TRUOC CHO 0901234567',
  },
  {
    name: 'ACB ONE — chuyển khoản, mã cuối kiểu "VerF…"',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 1234xxxx(VND) - 600,000 luc 10:02 28/10/2026. So du 396,178. GD: NGUYEN VAN A CHUYEN KHOAN-281026-10:02:55 VerF701931',
    amount: 600_000,
    direction: 'OUT',
    description: 'NGUYEN VAN A CHUYEN KHOAN',
  },
  {
    name: 'ACB ONE — tiền vào thật: "+ 450,000", bỏ phần lặp ", IB … CHUYEN KHOAN"',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 1234xxxx(VND) + 450,000 luc 10:01 28/10/2026. So du 996,178. GD: NGUYEN VAN A CK, IB NGUYEN VAN A CHUYEN KHOAN',
    amount: 450_000,
    direction: 'IN',
    description: 'NGUYEN VAN A CK',
  },
  {
    name: 'ACB ONE — chuyển sang tài khoản khác ("CK cho TK <số>_<TÊN>")',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 5678xxxx(VND) - 450,000 luc 10:01 28/10/2026. So du 12,979. GD: CK cho TK 12345678_NGUYEN VAN A, IB NGUYEN VAN A CHUYEN KHOAN',
    amount: 450_000,
    direction: 'OUT',
    description: 'CK cho TK 12345678_NGUYEN VAN A',
  },
  {
    name: 'ACB ONE — tiền vào từ người khác',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 5678xxxx(VND) + 500,000 luc 18:39 28/10/2026. So du 512,979. GD: LE THI B CK, IB LE THI B CHUYEN KHOAN',
    amount: 500_000,
    direction: 'IN',
    description: 'LE THI B CK',
  },
  {
    name: 'ACB ONE — tiền vào từ MoMo (công ty dịch vụ di động trực tuyến)',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 1234xxxx(VND) + 35,000 luc 14:02 28/10/2026. So du 256,178. GD: CONG TY CO PHAN DICH VU DI DONG TRUC TUYEN',
    amount: 35_000,
    direction: 'IN',
  },
  {
    name: 'ACB ONE — quét QR trả tiền cửa hàng: bỏ "IB QR<mã>" và đuôi " ddmmyy-hh:mm:ss <mã>" (không có dấu -)',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 5678xxxx(VND) - 13,000 luc 08:22 30/10/2026. So du 324,423. GD: IB QRABC123XY MINISTOP 301026-08:22:27 6303ASCB02ABCD56',
    amount: 13_000,
    direction: 'OUT',
    description: 'MINISTOP',
  },
  {
    name: 'ACB ONE — số tiền nhỏ, nội dung không có đuôi mã',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 1234xxxx(VND) - 2,000 luc 15:21 29/10/2026. So du 40,178. GD: NGUYEN VAN A CHUYEN KHOAN',
    amount: 2_000,
    direction: 'OUT',
    description: 'NGUYEN VAN A CHUYEN KHOAN',
  },
  {
    name: 'ACB ONE — mã cuối kiểu "LbaU…"',
    text: 'Thong bao thay doi so du tai khoan\nACB: TK 1234xxxx(VND) - 2,000 luc 15:22 29/10/2026. So du 38,178. GD: NGUYEN VAN A CHUYEN KHOAN-291026-15:22:39 LbaU312927',
    amount: 2_000,
    direction: 'OUT',
    description: 'NGUYEN VAN A CHUYEN KHOAN',
  },
  {
    name: '"tài khoản" không bị lấy làm nội dung như "tại <cửa hàng>"',
    text: 'Bien dong so du tai khoan ACB: TK 12345678(VND) - 50,000 luc 22:41 29/10/2026',
    amount: 50_000,
    direction: 'OUT',
    description: null,
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
