import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

class InviteError extends Error {}

const activePartnershipOf = (userId: number) => ({
  endedAt: null,
  OR: [{ userAId: userId }, { userBId: userId }],
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const id = parseInt((await params).id, 10);
  const { action } = await request.json().catch(() => ({}));

  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation || invitation.status !== 'PENDING') {
    return NextResponse.json({ error: 'Lời mời không còn hiệu lực' }, { status: 404 });
  }

  if (action === 'cancel' || action === 'decline') {
    const allowed = action === 'cancel' ? invitation.fromUserId === user.id : invitation.toUserId === user.id;
    if (!allowed) return NextResponse.json({ error: 'Lời mời không còn hiệu lực' }, { status: 404 });

    await prisma.invitation.update({
      where: { id },
      data: { status: action === 'cancel' ? 'CANCELED' : 'DECLINED', respondedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  }

  if (action !== 'accept' || invitation.toUserId !== user.id) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const [inviter, invitee] = await Promise.all([
        tx.user.findUniqueOrThrow({ where: { id: invitation.fromUserId } }),
        tx.user.findUniqueOrThrow({ where: { id: invitation.toUserId } }),
      ]);

      if (await tx.partnership.findFirst({ where: activePartnershipOf(invitee.id) })) {
        throw new InviteError('Bạn đang liên kết với một tài khoản khác. Hãy hủy liên kết trước.');
      }
      if (await tx.partnership.findFirst({ where: activePartnershipOf(inviter.id) })) {
        throw new InviteError('Người mời đã liên kết với một tài khoản khác.');
      }

      // Mỗi cặp chỉ có một Partnership: liên kết lại thì mở lại bản ghi cũ để giữ dữ liệu
      const [userAId, userBId] = [inviter.id, invitee.id].sort((a, b) => a - b);
      const partnership = await tx.partnership.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        update: { endedAt: null },
        create: { userAId, userBId },
      });

      for (const u of [inviter, invitee]) {
        const member = await tx.member.findFirst({ where: { partnershipId: partnership.id, userId: u.id } });
        if (!member) {
          await tx.member.create({ data: { name: u.name, userId: u.id, partnershipId: partnership.id } });
        }
      }

      await tx.invitation.update({ where: { id }, data: { status: 'ACCEPTED', respondedAt: new Date() } });

      // Các lời mời đang chờ khác của hai người không còn ý nghĩa
      await tx.invitation.updateMany({
        where: {
          status: 'PENDING',
          OR: [
            { fromUserId: { in: [inviter.id, invitee.id] } },
            { toUserId: { in: [inviter.id, invitee.id] } },
          ],
        },
        data: { status: 'CANCELED', respondedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof InviteError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Không thể chấp nhận lời mời' }, { status: 500 });
  }
}
