<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mở và đóng phiên

**Mở phiên:** đọc `docs/_internal/viec-con-treo.md` (danh sách duy nhất của việc chưa làm) rồi
khối mới nhất của `docs/_internal/nhat-ky-lam-viec.md`. Chủ sản phẩm nói *"làm gì tiếp"* thì
**trước hết đối chiếu nhật ký với git** (`git log` từ ngày của khối mới nhất, `git status`):
commit hay thay đổi nào chưa được kể trong nhật ký thì ghi bổ sung ngay, **không commit**. Rồi
mới đề xuất việc tiếp theo từ hai file đó, không hỏi lại.

**Đóng phiên:** chủ sản phẩm nói *"ghi lại những gì đã làm"* (ở phiên nào, mấy lần một ngày
cũng được) **hoặc *"đẩy production"*** — làm đủ, không hỏi lại, và với *"đẩy production"* thì
làm **trước khi đẩy**:

1. Thêm **một khối cho phiên này** lên đầu `nhat-ky-lam-viec.md` theo khuôn ở đầu file. Phiên
   đã có khối thì bổ sung vào chính khối đó, không sửa khối của phiên khác.
2. Việc chưa làm đưa vào `viec-con-treo.md`, việc đã xong thì xoá dòng ở đó.
3. Nhật ký quá hai ngày có ghi thì chuyển khối cũ nhất sang `nhat-ky-lam-viec-YYYY-MM.md`.
4. Nhật ký đi thành commit `docs(internal):` riêng, đẩy cùng lượt với commit tính năng.

Đẩy production = push `main`; Vercel tự build (`prisma db push && next build`) và deploy.
Đổi schema thì chỉ **thêm** cột/bảng có mặc định hoặc cho phép null — `db push` chạy thẳng
lên database thật. **Không thêm `@unique` vào bảng đã có dữ liệu** (kể cả cột mới cho phép null): `db push`
đòi `--accept-data-loss`, build trên Vercel không có cờ đó nên deploy hỏng — dùng `@@index` (29/10, `User.importTokenHash`).

Sửa bộ đọc thông báo (`src/lib/notification-parser.ts`) hay bộ đoán danh mục: thêm mẫu thành ca trong file `*.test.ts`
cạnh nó **trước**, rồi mới sửa; `npm test` phải qua trước khi đẩy.
