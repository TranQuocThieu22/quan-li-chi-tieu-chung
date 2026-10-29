// Phần dùng chung cho nhập giao dịch từ thông báo điện thoại (chỉ chạy ở server)
import { createHash, randomBytes } from 'node:crypto';
import prisma from '@/lib/db';

export const hashImportToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const newImportToken = () => randomBytes(24).toString('base64url');

// Gắn khoản chi vừa tạo với thông báo đã nhập; chỉ nhận khi thông báo là của người này và còn chờ xác nhận
export async function resolveImport(
  userId: number,
  importId: unknown,
  link: { expenseId: number } | { personalExpenseId: number },
) {
  const id = Number(importId);
  if (!Number.isInteger(id) || id <= 0) return;
  await prisma.importedTransaction.updateMany({
    where: { id, userId, status: 'PENDING' },
    data: { status: 'ACCEPTED', resolvedAt: new Date(), ...link },
  });
}

// Thông báo đang chờ của người dùng, dùng cho trang nhập khoản chi điền sẵn
export function findPendingImport(userId: number, importId: unknown) {
  const id = Number(importId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return prisma.importedTransaction.findFirst({ where: { id, userId, status: 'PENDING' } });
}

export const countPendingImports = (userId: number) =>
  prisma.importedTransaction.count({ where: { userId, status: 'PENDING' } });

// Ngày theo giờ Việt Nam (YYYY-MM-DD) cho ô ngày của form — server chạy giờ UTC nên giao dịch trước 7h sáng sẽ lệch một ngày
export const vietnamDate = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

// Dữ liệu điền sẵn cho form từ một giao dịch đang chờ
export async function importPrefill(userId: number, importId: unknown) {
  const pending = await findPendingImport(userId, importId);
  if (!pending || !pending.amount) return undefined;
  return {
    importId: pending.id,
    item: pending.description ?? pending.title ?? '',
    amount: pending.amount,
    date: vietnamDate(pending.occurredAt),
  };
}
