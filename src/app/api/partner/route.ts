import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getActivePartnerships, getCurrentUser, getPartner, publicUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const [partnerships, incoming, outgoing] = await Promise.all([
    getActivePartnerships(user.id),
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
    partners: partnerships.map(p => ({ partnershipId: p.id, user: publicUser(getPartner(p, user.id)), linkedAt: p.createdAt })),
    incoming: incoming.map(i => ({ id: i.id, user: publicUser(i.fromUser), createdAt: i.createdAt })),
    outgoing: outgoing.map(i => ({ id: i.id, user: publicUser(i.toUser), createdAt: i.createdAt })),
  });
}
