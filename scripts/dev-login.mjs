// In cookie đăng nhập cho một người dùng mẫu ở máy, để mở app mà không qua Google: npm run dev:login [-- email]
// Chỉ chạy tay ở máy, app không có đường đăng nhập nào thêm. Cookie ký bằng AUTH_SECRET trong .env.local
// (khác khoá production) nên không dùng được ở bản thật.
import { createHmac } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL ?? '';
let host = '';
try {
  host = new URL(url).hostname;
} catch {}
if (!['localhost', '127.0.0.1'].includes(host)) {
  console.error('Từ chối: DATABASE_URL không phải database ở máy. Chạy qua npm run dev:login để nạp .env.local.');
  process.exit(1);
}
const secret = process.env.AUTH_SECRET;
if (!secret) {
  console.error('Thiếu AUTH_SECRET trong .env.local.');
  process.exit(1);
}

const prisma = new PrismaClient();
const email = process.argv[2] ?? 'dev.thieu@example.com';
const user = await prisma.user.findUnique({ where: { email } });
await prisma.$disconnect();
if (!user) {
  console.error(`Không có người dùng ${email}. Chạy npm run db:seed trước.`);
  process.exit(1);
}

// Cùng định dạng với createSessionToken trong src/lib/session.ts
const payload = Buffer.from(
  JSON.stringify({ uid: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 }),
).toString('base64url');
const token = `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;

console.log(`Cookie đăng nhập cho ${user.name} (${email}), hạn 30 ngày.`);
console.log('Mở http://localhost:4000/login, bật DevTools (F12) → Console, dán dòng dưới rồi tải lại trang:\n');
console.log(`document.cookie = "session=${token}; path=/; max-age=2592000"; location.href = "/";`);
