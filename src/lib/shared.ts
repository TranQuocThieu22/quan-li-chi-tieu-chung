// Danh mục cho khoản chi trong sổ chung; dùng được cả ở client và server, không import Prisma

export const SHARED_CATEGORIES = [
  { key: 'food', label: 'Ăn uống', icon: '🍜' },
  { key: 'groceries', label: 'Đi chợ', icon: '🛒' },
  { key: 'bills', label: 'Hóa đơn', icon: '🧾' },
  { key: 'home', label: 'Nhà cửa', icon: '🏠' },
  { key: 'transport', label: 'Di chuyển', icon: '🚗' },
  { key: 'shopping', label: 'Mua sắm', icon: '🛍️' },
  { key: 'entertainment', label: 'Giải trí', icon: '🎮' },
  { key: 'other', label: 'Khác', icon: '📦' },
] as const;

export function getSharedCategory(key: unknown) {
  return SHARED_CATEGORIES.find(c => c.key === key) ?? SHARED_CATEGORIES[SHARED_CATEGORIES.length - 1];
}

// Expense.imageUrl lưu dạng JSON mảng, dữ liệu cũ có thể chỉ là một đường dẫn
export function parseImages(imageUrl: string | null) {
  if (!imageUrl || imageUrl === '[]') return [];
  try {
    const parsed = JSON.parse(imageUrl);
    return Array.isArray(parsed) ? (parsed as string[]) : [imageUrl];
  } catch {
    return [imageUrl];
  }
}
