import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getActivePartnerships, getCurrentUser } from '@/lib/auth';

const ACTIONS = ['settle', 'unsettle', 'delete'] as const;
type BulkAction = (typeof ACTIONS)[number];

// Đánh dấu đã trả / bỏ đã trả / xóa nhiều khoản chi được tick chọn ở trang chủ
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const action = body?.action as BulkAction;
  const ids: number[] = Array.isArray(body?.ids)
    ? [...new Set((body.ids as unknown[]).filter((id): id is number => Number.isInteger(id)))]
    : [];

  if (!ACTIONS.includes(action) || ids.length === 0) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 400 });
  }

  // Chỉ thao tác trên khoản chi thuộc sổ người dùng đang liên kết
  const partnerships = await getActivePartnerships(user.id);
  const expenses = await prisma.expense.findMany({
    where: { id: { in: ids }, isDeleted: false, partnershipId: { in: partnerships.map(p => p.id) } },
    include: { payer: true, beneficiary: true },
  });
  if (expenses.length === 0) {
    return NextResponse.json({ error: 'Không tìm thấy khoản chi nào' }, { status: 404 });
  }

  const isSettled = action === 'settle';
  // Bỏ qua khoản đã ở đúng trạng thái để không ghi lịch sử thừa
  const targets = action === 'delete' ? expenses : expenses.filter(e => e.isSettled !== isSettled);
  if (targets.length === 0) return NextResponse.json({ count: 0 });

  const historyAction = action === 'delete' ? 'DELETE' : isSettled ? 'SETTLE' : 'UNSETTLE';

  try {
    await prisma.$transaction([
      prisma.expenseHistory.createMany({
        data: targets.map(e => ({
          expenseId: e.id,
          action: historyAction,
          oldItem: e.item,
          oldAmount: e.amount,
          oldPayerName: e.payer.name,
          oldBeneficiaryName: e.beneficiary?.name,
          oldDate: e.date,
          oldNotes: e.notes,
          oldImageUrl: e.imageUrl,
        })),
      }),
      prisma.expense.updateMany({
        where: { id: { in: targets.map(e => e.id) } },
        data: action === 'delete'
          ? { isDeleted: true }
          : { isSettled, settledAt: isSettled ? new Date() : null },
      }),
    ]);

    return NextResponse.json({ count: targets.length });
  } catch {
    return NextResponse.json({ error: 'Thao tác hàng loạt không thành công' }, { status: 500 });
  }
}
