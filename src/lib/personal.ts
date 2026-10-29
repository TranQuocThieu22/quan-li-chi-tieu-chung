// Dùng được cả ở client (form) và server (API), không import Prisma
import { makeCategoryGuesser } from './guess-category';

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

// Từ khoá đoán danh mục cá nhân (cách so ở makeCategoryGuesser); đi chợ, siêu thị tính vào Ăn uống
export const guessPersonalCategory = makeCategoryGuesser({
  food: ['ăn', 'cơm', 'bún', 'phở', 'lẩu', 'pizza', 'gà rán', 'trà sữa', 'cà phê', 'cafe', 'coffee', 'highlands', 'phúc long',
    'starbucks', 'nướng', 'nhà hàng', 'bánh', 'kem', 'bia', 'nhậu', 'đồ ăn', 'buffet', 'snack', 'chợ', 'đi chợ', 'siêu thị',
    'circle k', 'gs25', 'winmart', 'bách hóa', 'shopeefood', 'grabfood', 'baemin'],
  transport: ['xăng', 'grab', 'taxi', 'xe', 'gửi xe', 'rửa xe', 'xe buýt', 'bus', 'máy bay', 'vé máy bay', 'tàu', 'be',
    'gojek', 'xanh sm', 'vietjet', 'vietnam airlines'],
  shopping: ['quần áo', 'áo', 'quần', 'giày', 'dép', 'túi', 'shopee', 'lazada', 'tiki', 'tiktok shop', 'mỹ phẩm', 'đồ dùng',
    'uniqlo'],
  bills: ['điện', 'nước', 'internet', 'wifi', 'mạng', '4g', 'gas', 'hóa đơn', 'cước', 'truyền hình', 'tiền nhà', 'thuê nhà',
    'nạp tiền điện thoại', 'nạp điện thoại'],
  entertainment: ['phim', 'xem phim', 'cgv', 'netflix', 'spotify', 'youtube', 'game', 'steam', 'karaoke', 'du lịch', 'concert'],
  health: ['thuốc', 'nhà thuốc', 'pharmacity', 'long châu', 'khám', 'bệnh viện', 'phòng khám', 'nha khoa', 'gym', 'bảo hiểm'],
  education: ['sách', 'học phí', 'khóa học', 'udemy', 'coursera', 'fahasa', 'học'],
});

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
