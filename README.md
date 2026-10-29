# Quản Lý Chi Tiêu Chung

Ứng dụng web (cài được ra màn hình chính điện thoại) để hai người ghi và chia chi tiêu chung, kèm sổ chi tiêu cá nhân.

- **Sổ chung**: mỗi cặp tài khoản liên kết có một sổ riêng. Ghi khoản chi theo danh mục, ai trả, mua giùm; tự tính ai cần
  trả ai bao nhiêu; đánh dấu đã trả (từng khoản hoặc nhiều khoản một lúc); lịch sử sửa từng khoản.
- **Cá nhân**: chi tiêu riêng theo danh mục, ngân sách tháng, tổng chi thực tế (gồm cả phần của mình trong sổ chung).
- **Thống kê**: chi chung theo tháng, theo danh mục, ai đã chi bao nhiêu.
- Đăng nhập bằng Google. Liên kết với người khác bằng lời mời qua email.

Next.js 16 (App Router) · React 19 · Prisma 6 · PostgreSQL. Triển khai trên Vercel: push lên `main` là tự build
(`prisma db push && next build`) và lên production.

## Chạy ở máy

Cần Node 22+ và Docker Desktop.

```bash
npm install
npm run db:up      # Postgres trong Docker, cổng 5544 (compose.yaml)
npm run db:push    # tạo bảng theo prisma/schema.prisma
npm run db:seed    # dữ liệu mẫu: 3 người dùng, 2 sổ chung, ~6 tháng chi tiêu — XOÁ SẠCH dữ liệu cũ trong database ở máy
npm run dev        # http://localhost:4000
```

`db:push`, `db:seed`, `dev:login` đọc `.env.local`; `seed` và `dev:login` từ chối chạy nếu `DATABASE_URL` không phải `localhost`.

### `.env.local`

Next.js ưu tiên file này hơn `.env`. Không commit (`.gitignore` đã chặn `.env*`).

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5544/chi_tieu"
AUTH_SECRET="<chuỗi ngẫu nhiên bất kỳ>"   # node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Muốn đăng nhập Google thật ở máy thì thêm `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (đặt trong `.env` hay `.env.local` đều được).

### Đăng nhập ở máy không cần Google

```bash
npm run dev:login                               # Quốc Thiệu (dev.thieu@example.com)
npm run dev:login -- dev.minhanh@example.com    # người còn lại trong sổ
```

Lệnh in ra một dòng JavaScript. Mở `http://localhost:4000/login`, F12 → Console, dán dòng đó là vào app. Cookie ký bằng
`AUTH_SECRET` của `.env.local` nên không dùng được trên production; app không có đường đăng nhập nào thêm.

Tắt database: `docker compose stop` (dữ liệu giữ trong volume `chi-tieu-db`).

## Biến môi trường trên Vercel

| Biến | Dùng cho |
| --- | --- |
| `DATABASE_URL` | Postgres production |
| `AUTH_SECRET` | ký cookie đăng nhập |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | đăng nhập Google |
| `APP_URL` (tùy chọn) | origin cố định cho địa chỉ callback Google, khi chạy sau proxy làm sai origin |

Đổi schema: chỉ **thêm** cột/bảng có giá trị mặc định hoặc cho phép null — `prisma db push` chạy thẳng lên database thật
mỗi lần deploy.

## Tài liệu nội bộ

- [`docs/_internal/viec-con-treo.md`](docs/_internal/viec-con-treo.md) — việc chưa làm
- [`docs/_internal/nhat-ky-lam-viec.md`](docs/_internal/nhat-ky-lam-viec.md) — nhật ký làm việc
- [`AGENTS.md`](AGENTS.md) — quy ước mở / đóng phiên cho Claude
