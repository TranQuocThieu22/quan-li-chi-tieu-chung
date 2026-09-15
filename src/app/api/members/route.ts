import { NextResponse } from 'next/server';
import { getPartner, requirePartnership } from '@/lib/auth';

// Thành viên của một sổ là hai tài khoản đã liên kết; ?partnershipId= để lấy sổ cụ thể, mặc định là sổ đang chọn
export async function GET(request: Request) {
  const ctx = await requirePartnership(new URL(request.url).searchParams.get('partnershipId'));
  if (!ctx.ok) return ctx.response;

  return NextResponse.json({
    partnershipId: ctx.partnership.id,
    partnerName: getPartner(ctx.partnership, ctx.user.id).name,
    members: ctx.partnership.members.map(m => ({ id: m.id, name: m.name, isMe: m.userId === ctx.user.id })),
  });
}
