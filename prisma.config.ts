// Cấu hình Prisma CLI (generate, db push). Prisma 7 không tự đọc file .env: ở máy các lệnh chạy qua
// `node --env-file=.env.local`, trên Vercel biến môi trường có sẵn.
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // generate không cần kết nối nên để trống được; db push thì cần
    url: process.env.DATABASE_URL ?? '',
  },
});
