# Nhật ký làm việc — 11/2026 (lưu trữ)

> Các khối đã quá hai ngày, chuyển nguyên văn từ [`nhat-ky-lam-viec.md`](nhat-ky-lam-viec.md). Mới nhất nằm trên.

---

## 01/11/2026 — Cần thanh toán cộng nợ chưa trả của các tháng trước; sửa chữ tràn khỏi nút; lên production

> Chủ sản phẩm: *"Tháng này phải xem được với các tổng nợ tháng trước chưa thanh toán nữa cộng vào"* → *"đẩy production"* →
> (gửi ảnh điện thoại) *"Bị lỗi chữ ra ngoài nút"* → *"đẩy production"*.

**Đã làm**

- Commit *feat: carry unpaid debts from earlier months into this month*: thẻ *Cần thanh toán* (trang Sổ chung) tính nợ từ khoản chưa
  trả của tháng đang xem **cộng mọi khoản chưa trả có ngày trước tháng đó**, bù trừ một lượt (công nợ cộng được nên bằng tổng nợ
  từng tháng). Có nợ cũ thì hiện dòng *"Đã cộng nợ chưa trả của N tháng trước"* và nợ chia theo tháng (tháng cũ có liên kết sang
  tháng đó); mã VietQR lấy số tổng, nội dung *"Chi tieu chung den thang …"*; nút đổi thành *"Đã thanh toán xong tháng … và nợ
  tháng trước"*, đánh dấu cả khoản cũ. Tổng chi chung, Mỗi người, Đã chi trả, Theo danh mục vẫn chỉ tháng đang xem. Phần tính
  nợ tách ra `src/lib/debts.ts` (`settleDebts`, `groupByMonth`), 5 ca thử; 96/96.
- Kiểm ở máy (Postgres + seed, Chrome ẩn 390 px): tháng 11 ra 6.756.000 ₫ = 1.925.000 + 2.200.000 − 156.000 + 2.500.000 +
  287.000 (11, 10, 9, 7, 6); xem tháng 10 thì không cộng tháng 11; tháng 6 không có nợ cũ thì như trước. Bấm nút: 8 khoản sang đã
  trả, 8 dòng lịch sử `SETTLE`, sổ kia không đổi. `tsc`, lint, `next build` sạch.
- Commit *fix: keep the settle button label inside the button* (lượt đẩy thứ hai): trên điện thoại chủ sản phẩm, chữ *"Đã thanh
  toán xong tháng 11 và nợ tháng trước"* tràn hai bên nút vì `.btn` có `white-space: nowrap`. Có nợ cũ thì nút ghi *"Đã trả hết nợ
  đến tháng 11"* (prop `label` của `SettleMonthButton`; hộp xác nhận vẫn ghi đủ); `.btn-block` cho xuống dòng. Kiểm ở 360 px: chữ
  mới một dòng, chữ dài cũ xuống hai dòng trong nút.

**Quan sát**

- Tháng cũ (trước khi có nút thanh toán xong tháng 30/10) đã trả ngoài nhưng chưa đánh dấu sẽ hiện ra và bị cộng vào tổng —
  chủ sản phẩm đã được báo; nút ở trang tháng nào cũng đánh dấu luôn mọi tháng trước nó.
