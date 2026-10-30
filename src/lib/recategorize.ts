// Xếp lại danh mục cho khoản chi chung tạo trước khi sổ chung có danh mục (chỉ chạy ở server)
import prisma from '@/lib/db';
import { buildKnownCategories } from '@/lib/guess-category';
import { proposeSharedCategory } from '@/lib/shared';

// Danh mục sổ chung lên production chiều 29/10/2026 (commit 4a7d696 lúc 13:27 giờ VN, lấy dư tới 14:00): khoản tạo
// trước đó đều mặc định "Khác". Khoản tạo sau mà là "Khác" là người dùng tự chọn, không đề xuất đổi.
const CATEGORIES_SINCE = new Date('2026-10-29T07:00:00Z');

// Đã lưu ở trang xếp danh mục của sổ này (trên máy này) thì thôi nhắc — khoản còn để "Khác" là người dùng chọn để nguyên
export const recategorizedCookie = (partnershipId: number) => `recategorized-${partnershipId}`;

// Khoản cũ đang là "Khác" của một sổ, mới nhất trước, kèm danh mục đề xuất (null nếu không đoán được)
export async function findOldUncategorized(partnershipId: number) {
  const old = await prisma.expense.findMany({
    where: { partnershipId, isDeleted: false, category: 'other', createdAt: { lt: CATEGORIES_SINCE } },
    orderBy: { date: 'desc' },
    select: { id: true, item: true, amount: true, date: true, payer: { select: { name: true } } },
  });
  if (old.length === 0) return [];

  // buildKnownCategories cần khoản mới nhất trước
  const categorized = await prisma.expense.findMany({
    where: { partnershipId, isDeleted: false, category: { not: 'other' } },
    orderBy: { date: 'desc' },
    select: { item: true, category: true },
  });
  const known = buildKnownCategories(categorized);
  return old.map(e => ({ ...e, proposed: proposeSharedCategory(e.item, known) }));
}
