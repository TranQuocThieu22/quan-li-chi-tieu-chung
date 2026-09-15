import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireSuperAdmin, ROOT_SUPERADMIN_EMAIL } from '@/lib/auth';

// Cấp hoặc gỡ quyền superadmin cho một người dùng
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSuperAdmin();
  if (!ctx.ok) return ctx.response;

  const id = parseInt((await params).id, 10);
  const { isSuperAdmin } = await request.json().catch(() => ({}));
  if (typeof isSuperAdmin !== 'boolean') {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
  if (target.email === ROOT_SUPERADMIN_EMAIL) {
    return NextResponse.json({ error: 'Không thể thay đổi quyền của superadmin mặc định' }, { status: 400 });
  }
  if (target.id === ctx.user.id) {
    return NextResponse.json({ error: 'Không thể tự thay đổi quyền của chính mình' }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id }, data: { isSuperAdmin } });
  return NextResponse.json({ id: updated.id, isSuperAdmin: updated.isSuperAdmin });
}
