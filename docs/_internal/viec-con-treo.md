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
- [ ] **Chọn lại danh mục cho khoản chi chung cũ** nếu muốn thẻ *Theo danh mục* có ý nghĩa (29/10): mọi khoản tạo trước 29/10
      đang là 📦 Khác — vào *Sửa* từng khoản.

## 2. Chờ chủ sản phẩm quyết

- [ ] **Tám danh mục sổ chung có đủ chưa** (29/10): đang là Ăn uống, Đi chợ, Hóa đơn, Nhà cửa, Di chuyển, Mua sắm, Giải trí,
      Khác ([`src/lib/shared.ts`](../../src/lib/shared.ts)). Lưới chọn 4 cột nên thêm thì nên thêm đủ 4 (vd. Sức khỏe, Du lịch…).
- [ ] **Xác nhận cách tính của trang Thống kê** (29/10): Claude chọn *chi chung = mọi khoản không phải mua giùm, tính cả khoản đã
      trả* (đã trả chỉ là đã thanh toán với nhau, tiền vẫn đã chi); mua giùm tách thẻ riêng. Khác tổng ở trang chủ (chỉ khoản chưa
      trả) — trang Thống kê có ghi một dòng giải thích. Muốn tính khác thì báo.

## 3. Claude làm được khi được giao

- [ ] **Hai lỗi nhỏ có từ trước** (29/10): `.env` vẫn để `DATABASE_URL="file:./dev.db"` (không còn dùng vì `.env.local` đè lên,
      nhưng `npm run build` ở máy sẽ hỏng vì nó đọc `.env`); tỉ lệ dưới 0,5% ở thẻ danh mục hiện `0%`.

## 4. Khi tới mốc

- [ ] **Khi database lớn dần — chuyển ảnh hóa đơn ra khỏi database** (28/10): ảnh đang lưu thẳng dạng base64 trong
      `Expense.imageUrl` (tối đa 5 MB mỗi ảnh), mỗi lần tải trang chủ là kéo theo cả ảnh của tháng đó.
