import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, LEDGER_COOKIE, ledgerCookieOptions, pairKey } from '@/lib/auth';

class InviteError extends Error {}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const id = parseInt((await params).id, 10);
  const { action } = await request.json().catch(() => ({}));

  const invitation = Number.isInteger(id) ? await prisma.invitation.findUnique({ where: { id } }) : null;
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
    const partnershipId = await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({ where: { id: { in: [invitation.fromUserId, invitation.toUserId] } } });
      const pair = pairKey(invitation.fromUserId, invitation.toUserId);

      // Mỗi cặp chỉ có một sổ: liên kết lại thì mở lại sổ cũ để giữ dữ liệu
      const existing = await tx.partnership.findUnique({ where: { userAId_userBId: pair } });
      if (existing && !existing.endedAt) throw new InviteError('Hai bạn đã liên kết với nhau rồi.');
      const partnership = existing
        ? await tx.partnership.update({ where: { id: existing.id }, data: { endedAt: null } })
        : await tx.partnership.create({ data: pair });

      for (const u of users) {
        const member = await tx.member.findFirst({ where: { partnershipId: partnership.id, userId: u.id } });
        if (!member) {
          await tx.member.create({ data: { name: u.name, userId: u.id, partnershipId: partnership.id } });
        }
      }

      await tx.invitation.update({ where: { id }, data: { status: 'ACCEPTED', respondedAt: new Date() } });

      // Lời mời theo chiều ngược lại giữa hai người không còn ý nghĩa; lời mời với người khác vẫn giữ nguyên
      await tx.invitation.updateMany({
        where: {
          status: 'PENDING',
          OR: [
            { fromUserId: invitation.fromUserId, toUserId: invitation.toUserId },
            { fromUserId: invitation.toUserId, toUserId: invitation.fromUserId },
          ],
        },
        data: { status: 'CANCELED', respondedAt: new Date() },
      });

      return partnership.id;
    });

    // Mở luôn sổ vừa liên kết
    const response = NextResponse.json({ success: true, partnershipId });
    response.cookies.set(LEDGER_COOKIE, String(partnershipId), ledgerCookieOptions);
    return response;
  } catch (error) {
    if (error instanceof InviteError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Không thể chấp nhận lời mời' }, { status: 500 });
  }
}
