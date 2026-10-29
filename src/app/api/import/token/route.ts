import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hashImportToken, newImportToken } from '@/lib/import';

// Tạo mã nhận thông báo mới (mã cũ hết hiệu lực ngay). Chỉ trả bản gốc một lần — database giữ bản băm.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const token = newImportToken();
  await prisma.user.update({ where: { id: user.id }, data: { importTokenHash: hashImportToken(token) } });
  return NextResponse.json({ token });
}

// Tắt nhận thông báo
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  await prisma.user.update({ where: { id: user.id }, data: { importTokenHash: null } });
  return NextResponse.json({ ok: true });
}
