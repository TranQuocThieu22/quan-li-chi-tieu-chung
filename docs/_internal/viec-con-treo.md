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

- [ ] **Mở trên điện thoại các trang Claude chưa nhìn tận mắt** (29/10): Thống kê, Lịch sử thay đổi, Liên kết, Nhật ký hoạt động,
      Superadmin, form thêm khoản chi chung (lưới danh mục), thẻ *Theo danh mục* ở trang chủ. Claude chỉ chụp được trang có dữ
      liệu giả vì local không có database. Chỗ nào xấu hay vỡ thì báo.
- [ ] **Chọn lại danh mục cho khoản chi chung cũ** nếu muốn thẻ *Theo danh mục* có ý nghĩa (29/10): mọi khoản tạo trước 29/10
      đang là 📦 Khác — vào *Sửa* từng khoản.

## 2. Chờ chủ sản phẩm quyết

- [ ] **Tám danh mục sổ chung có đủ chưa** (29/10): đang là Ăn uống, Đi chợ, Hóa đơn, Nhà cửa, Di chuyển, Mua sắm, Giải trí,
      Khác ([`src/lib/shared.ts`](../../src/lib/shared.ts)). Lưới chọn 4 cột nên thêm thì nên thêm đủ 4 (vd. Sức khỏe, Du lịch…).
- [ ] **Trang Thống kê có tính khoản đã trả và khoản mua giùm không** (29/10): hiện cộng *mọi* khoản chưa xoá, trong khi tổng ở
      trang chủ bỏ khoản đã trả và mua giùm — hai con số dễ bị hiểu lệch nhau.

## 3. Claude làm được khi được giao

- [ ] **Cho chạy được app ở máy local** (28/10): `.env` để `DATABASE_URL="file:./dev.db"` nhưng schema là Postgres, nên `next dev`
      không đọc được dữ liệu; `dev.db` và `prisma/dev.db` là SQLite cũ còn nằm trong git. Cần một Postgres thử (Neon branch hoặc Docker).
- [ ] **Thống kê theo danh mục** ở trang Thống kê (29/10): trang chủ đã có cho từng tháng, Thống kê chưa có cho toàn thời gian.
- [ ] **Viết lại `README.md`** (28/10): vẫn là bản mẫu của create-next-app, chưa nói app làm gì, cần biến môi trường nào.

## 4. Khi tới mốc

- [ ] **Khi database lớn dần — chuyển ảnh hóa đơn ra khỏi database** (28/10): ảnh đang lưu thẳng dạng base64 trong
      `Expense.imageUrl` (tối đa 5 MB mỗi ảnh), mỗi lần tải trang chủ là kéo theo cả ảnh của tháng đó.
