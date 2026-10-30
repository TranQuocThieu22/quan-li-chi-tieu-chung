# Việc còn treo

> **Tài liệu nội bộ.** Đây là **danh sách DUY NHẤT** của việc chưa làm. Mở phiên mới thì đọc
> file này trước, rồi tới khối mới nhất của [`nhat-ky-lam-viec.md`](nhat-ky-lam-viec.md).

**Ba luật giữ cho file này ngắn:**

1. **Xong thì XOÁ dòng**, đừng gạch ngang giữ lại. Muốn biết xong khi nào thì tra
   `git log -p -- docs/_internal/viec-con-treo.md` hoặc nhật ký làm việc ngày đó.
2. **Mỗi việc tối đa ba dòng**: làm gì, vì sao, ghi ngày nào.
3. **Việc mới đi thẳng vào đây**, không ghi ở nhật ký làm việc.

File này cố ý **không có mục "Lịch sử cập nhật"** — lịch sử là `git log`.

---

## 1. Chủ sản phẩm làm

- [ ] **Xem các trang với dữ liệu thật trên điện thoại** (29/10): Claude đã bấm thử mọi trang ở máy với dữ liệu mẫu, nhưng số liệu
      thật (tên dài, khoản cũ chưa có danh mục, nhiều ảnh) có thể lộ chỗ chưa thấy. Chỗ nào xấu hay vỡ thì báo.
- [ ] **Xếp danh mục khoản chi chung cũ** (30/10): trang chủ có dòng *"N khoản cũ đang ở 📦 Khác…"* → xem đề xuất, sửa dòng sai,
      bấm *Lưu*. Báo Claude nếu nhiều khoản đoán sai hay rơi vào *Chưa đoán được* (để thêm từ khoá).
- [ ] **Nhập tài khoản nhận tiền và nhờ người cùng sổ quét thử** (30/10): *Cài đặt → Nhận tiền*. Mã VietQR đã khớp thư viện độc lập
      nhưng chưa ai quét bằng app ngân hàng thật — quét ra sai ngân hàng / số tiền thì báo.
- [ ] **Gửi Claude vài thông báo thật từ *Liên kết → Tự động nhập → Thông báo nhận gần đây*** (29/10): MacroDroid đã chạy, thanh
      toán đã hiện ở *Chờ xác nhận*. Chép nội dung gốc (che số tài khoản) — cả dòng đọc đúng lẫn dòng *Không đọc được* / sai số
      tiền — để làm bộ thử từ mẫu thật. Còn thiếu: ACB ONE **tiền vào** (mẫu trong test do Claude viết).

## 2. Chờ chủ sản phẩm quyết

(Không có — 29/10 chốt: thêm 4 danh mục sổ chung theo Claude chọn; Thống kê giữ cách tính hiện tại.)

## 3. Claude làm được khi được giao

- [ ] **Chỉnh bộ đọc thông báo theo thông báo thật** (29/10): mẫu VCB, MB, BIDV, Techcombank, VPBank, MoMo do Claude tự viết; mẫu
      thật mới có ACB ONE (quảng cáo [QC], chuyển khoản ra — đã sửa 29/10). Có mẫu thì thêm thành ca trong
      `src/lib/notification-parser.test.ts` **trước**, rồi mới sửa `src/lib/notification-parser.ts`, chạy `npm test`.
- [ ] **Nâng Prisma 6 → 7 khi tiện** (30/10): `npm audit` còn 3 lỗi high, cùng gốc `deepmerge-ts` trong `@prisma/config` — chỉ CLI
      (`db push` lúc build) dùng, app chạy không dính. Prisma 7 là bản lớn (đổi cách cấu hình, kết nối), cần làm và thử riêng một lượt.

## 4. Khi tới mốc

- [ ] **Khi trang chủ chậm — tải ảnh hóa đơn khi bấm xem thay vì nhúng sẵn** (28/10): ảnh vẫn lưu base64 trong `Expense.imageUrl`
      và trang chủ nhúng cả ảnh của tháng. Từ 29/10 ảnh mới được thu về 1600 px JPEG (~200–400 KB) lúc chọn, nhưng ảnh cũ giữ nguyên.
