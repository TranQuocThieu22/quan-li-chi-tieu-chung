import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, pairKey, publicUser } from '@/lib/auth';

// Chỉ tìm theo email chính xác để không lộ danh sách người dùng
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Vui lòng nhập email' }, { status: 400 });
  if (email === user.email) return NextResponse.json({ error: 'Đây là email của chính bạn' }, { status: 400 });

  const found = await prisma.user.findUnique({ where: { email } });
  if (!found) {
    return NextResponse.json(
      { error: 'Không tìm thấy tài khoản. Người này cần đăng nhập ứng dụng bằng Google ít nhất một lần.' },
      { status: 404 }
    );
  }

  const alreadyLinked = Boolean(
    await prisma.partnership.findFirst({ where: { ...pairKey(user.id, found.id), endedAt: null } })
  );
  return NextResponse.json({ user: publicUser(found), alreadyLinked });
}
