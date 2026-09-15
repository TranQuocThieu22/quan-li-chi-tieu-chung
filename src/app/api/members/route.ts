import { NextResponse } from 'next/server';
import { requirePartnership } from '@/lib/auth';

// Thành viên là hai tài khoản đang liên kết; được tạo tự động khi chấp nhận lời mời
export async function GET() {
  const ctx = await requirePartnership();
  if (!ctx.ok) return ctx.response;

  return NextResponse.json(
    ctx.partnership.members.map(m => ({ id: m.id, name: m.name, isMe: m.userId === ctx.user.id }))
  );
}
