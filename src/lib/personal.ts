// Dùng được cả ở client (form) và server (API), không import Prisma

export const PERSONAL_CATEGORIES = [
  { key: 'food', label: 'Ăn uống', icon: '🍜' },
  { key: 'transport', label: 'Di chuyển', icon: '🚗' },
  { key: 'shopping', label: 'Mua sắm', icon: '🛍️' },
  { key: 'bills', label: 'Hóa đơn', icon: '🧾' },
  { key: 'entertainment', label: 'Giải trí', icon: '🎮' },
  { key: 'health', label: 'Sức khỏe', icon: '💊' },
  { key: 'education', label: 'Giáo dục', icon: '📚' },
  { key: 'other', label: 'Khác', icon: '📦' },
] as const;

export function getCategory(key: string) {
  return PERSONAL_CATEGORIES.find(c => c.key === key) ?? PERSONAL_CATEGORIES[PERSONAL_CATEGORIES.length - 1];
}

export function parsePersonalExpenseInput(body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  const item = typeof input.item === 'string' ? input.item.trim() : '';
  const amount = Number(input.amount);
  const date = input.date ? new Date(String(input.date)) : new Date();

  if (!item) return { error: 'Vui lòng nhập nội dung chi tiêu' };
  if (!Number.isInteger(amount) || amount <= 0) return { error: 'Số tiền không hợp lệ' };
  if (Number.isNaN(date.getTime())) return { error: 'Ngày không hợp lệ' };

  return {
    data: {
      item,
      amount,
      category: getCategory(String(input.category)).key,
      date,
      notes: typeof input.notes === 'string' && input.notes.trim() ? input.notes.trim() : null,
    },
  };
}
