import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getActivePartnerships, getCurrentUser } from '@/lib/auth';

// Hủy một liên kết: dữ liệu của sổ được giữ lại và hiện lại nếu hai người liên kết lại với nhau
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const id = Number((await params).id);
  const partnership = (await getActivePartnerships(user.id)).find(p => p.id === id);
  if (!partnership) return NextResponse.json({ error: 'Không tìm thấy liên kết' }, { status: 404 });

  await prisma.partnership.update({ where: { id }, data: { endedAt: new Date() } });
  return NextResponse.json({ success: true });
}
