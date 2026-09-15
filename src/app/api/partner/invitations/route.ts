import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, pairKey, publicUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const { email } = await request.json();
    const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalized) return NextResponse.json({ error: 'Vui lòng nhập email' }, { status: 400 });
    if (normalized === user.email) return NextResponse.json({ error: 'Không thể tự liên kết với chính mình' }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { email: normalized } });
    if (!target) return NextResponse.json({ error: 'Không tìm thấy tài khoản với email này' }, { status: 404 });

    const linked = await prisma.partnership.findFirst({ where: { ...pairKey(user.id, target.id), endedAt: null } });
    if (linked) {
      return NextResponse.json({ error: 'Bạn đã liên kết với người này rồi.' }, { status: 409 });
    }

    const existing = await prisma.invitation.findFirst({
      where: {
        status: 'PENDING',
        OR: [
          { fromUserId: user.id, toUserId: target.id },
          { fromUserId: target.id, toUserId: user.id },
        ],
      },
    });
    if (existing) {
      const message = existing.fromUserId === user.id
        ? 'Bạn đã gửi lời mời cho người này rồi.'
        : 'Người này đã mời bạn. Hãy chấp nhận lời mời trong danh sách bên dưới.';
      return NextResponse.json({ error: message }, { status: 409 });
    }

    const invitation = await prisma.invitation.create({
      data: { fromUserId: user.id, toUserId: target.id },
    });
    return NextResponse.json({ id: invitation.id, user: publicUser(target), createdAt: invitation.createdAt }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Không gửi được lời mời' }, { status: 500 });
  }
}
