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

(Không có — 30/10 đã gửi mẫu ACB ONE thật, có cả tiền vào.)

## 2. Chờ chủ sản phẩm quyết

(Không có — 29/10 chốt: thêm 4 danh mục sổ chung theo Claude chọn; Thống kê giữ cách tính hiện tại.)

## 3. Claude làm được khi được giao

- [ ] **Bộ đọc thông báo cho ngân hàng / ví khác ACB** (30/10): mẫu MB, BIDV, Techcombank, VPBank, MoMo vẫn do Claude tự viết
      (ACB, VCB đã có mẫu thật). Khi dùng nơi khác mà đọc sai: thêm mẫu (che số TK, tên) thành ca trong `notification-parser.test.ts` **trước**, rồi sửa.

## 4. Khi tới mốc

- [ ] **Gỡ `scripts/move-new-categories.mjs` khỏi lệnh build** (31/10): sau khi log build Vercel lượt đẩy 31/10 có dòng
      `move-new-categories: … cá nhân / sổ chung …` (đã chạy trên production). Để lại thì vô hại (tự bỏ qua) nhưng tốn một lần đọc database mỗi build.

- [ ] **Khi trang chủ chậm — tải ảnh hóa đơn khi bấm xem thay vì nhúng sẵn** (28/10): ảnh vẫn lưu base64 trong `Expense.imageUrl`
      và trang chủ nhúng cả ảnh của tháng. Từ 29/10 ảnh mới được thu về 1600 px JPEG (~200–400 KB) lúc chọn, nhưng ảnh cũ giữ nguyên.
