# Nhật ký làm việc — 10/2026 (lưu trữ)

> Các khối đã quá hai ngày, chuyển nguyên văn từ [`nhat-ky-lam-viec.md`](nhat-ky-lam-viec.md). Mới nhất nằm trên.

---

## 28/10/2026 — Làm lại toàn bộ giao diện cho điện thoại; lên production sáng 29/10

> Chủ sản phẩm: *"update lại toàn bộ styles giao diện cho nhìn đẹp, hợp lí gọn gàng hơn cho mobile"* → *"đẩy production"*.

**Đã làm**

- Commit *feat: redesign UI for mobile*. Viết lại `globals.css` thành bộ style dùng chung (token màu, thẻ, nút, form, danh sách,
  badge, thanh tiến độ), chuyển gần hết inline style trong các trang sang class.
- **Thanh điều hướng dưới** (`BottomNav`: Sổ chung, Cá nhân, Thống kê, Liên kết) thay hàng bốn nút ở đầu trang; chưa liên kết thì
  ẩn Sổ chung và Thống kê. Trong khu cài đặt chỉ hiện trên điện thoại.
- `PageHeader` chung: tiêu đề trái, nút *+ Thêm* phải, nút quay lại thay nút *Hủy*. Ô chọn sổ chuyển vào phụ đề (*với Minh Anh ▾*);
  bỏ link *+ Liên kết thêm* vì đã có mục Liên kết ở thanh dưới.
- Chọn tháng có nút tháng trước / sau; trên điện thoại bảng chọn trượt lên từ đáy.
- Form: ô số tiền to, đứng đầu; *Người trả* và *Ngày* chung một hàng; danh mục cá nhân thành lưới 4 cột có emoji; chữ trong ô nhập
  16 px để iPhone không tự phóng to.
- Trang Cá nhân thay thẻ *Tổng chi tiêu cá nhân* (trùng với thẻ trên) bằng hai ô nhỏ: tháng này (▲/▼ %) và tháng trước. Thống kê
  có thanh tỉ lệ. Trang Lịch sử thành dòng thời gian, mỗi lần sửa chỉ hiện trường đã đổi. Đăng nhập có logo và nút Google nền trắng.
- `viewportFit: 'cover'` để dùng được `env(safe-area-inset-*)` trên iPhone; đổi màu theme sang `#0b1120` ở layout và manifest.

**Quan sát**

- Local không chạy được với dữ liệu (`.env` trỏ SQLite, schema là Postgres). Kiểm giao diện bằng một route tạm
  `/login/preview` (proxy bỏ qua xác thực với `/login/*`) với dữ liệu giả, chụp bằng Chrome ẩn qua DevTools Protocol ở 390 px — đã xoá
  route sau khi chụp. Chrome ẩn có độ rộng cửa sổ tối thiểu ~500 px: chụp bằng `--window-size=390` cho ảnh bị cắt như tràn ngang,
  phải dùng `Emulation.setDeviceMetricsOverride` mới đúng.
- Lần chụp đầu, hàng bốn nút dưới khoản chi (*Đã trả, Sửa, Lịch sử, Xóa*) rớt *Xóa* xuống dòng ở 390 px — giảm padding nút là vừa.
