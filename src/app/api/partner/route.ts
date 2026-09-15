import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getActivePartnership, getCurrentUser, getPartner, publicUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const [partnership, incoming, outgoing] = await Promise.all([
    getActivePartnership(user.id),
    prisma.invitation.findMany({
      where: { toUserId: user.id, status: 'PENDING' },
      include: { fromUser: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invitation.findMany({
      where: { fromUserId: user.id, status: 'PENDING' },
      include: { toUser: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    me: publicUser(user),
    partner: partnership ? publicUser(getPartner(partnership, user.id)) : null,
    incoming: incoming.map(i => ({ id: i.id, user: publicUser(i.fromUser), createdAt: i.createdAt })),
    outgoing: outgoing.map(i => ({ id: i.id, user: publicUser(i.toUser), createdAt: i.createdAt })),
  });
}

// Hủy liên kết: dữ liệu chi tiêu được giữ lại và hiện lại nếu hai người liên kết lại với nhau
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const partnership = await getActivePartnership(user.id);
  if (!partnership) return NextResponse.json({ error: 'Bạn chưa liên kết với tài khoản nào' }, { status: 400 });

  await prisma.partnership.update({ where: { id: partnership.id }, data: { endedAt: new Date() } });
  return NextResponse.json({ success: true });
}
