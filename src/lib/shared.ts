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

// Từ khoá đoán danh mục theo tên món. So nguyên từ và có dấu ("chợ" ≠ "cho", "sửa chữa" ≠ "sữa chua");
// cụm dài được so trước nên "nhà hàng" thắng "nhà".
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['ăn', 'cơm', 'bún', 'phở', 'lẩu', 'pizza', 'gà rán', 'trà sữa', 'cà phê', 'cafe', 'coffee', 'nướng', 'nhà hàng',
    'bánh', 'kem', 'bia', 'nhậu', 'đồ ăn', 'buffet', 'snack'],
  groceries: ['chợ', 'đi chợ', 'siêu thị', 'rau', 'thịt', 'cá', 'trứng', 'gạo', 'sữa', 'trái cây', 'hoa quả', 'bách hóa',
    'winmart', 'coopmart', 'co.op', 'lotte', 'big c', 'aeon'],
  bills: ['điện', 'nước', 'internet', 'wifi', 'mạng', 'gas', 'hóa đơn', 'cước', 'truyền hình', 'phí quản lý'],
  home: ['tiền nhà', 'thuê nhà', 'nhà', 'phòng', 'nội thất', 'dọn dẹp', 'sửa nhà', 'sửa chữa', 'ống nước'],
  transport: ['xăng', 'grab', 'taxi', 'xe', 'gửi xe', 'rửa xe', 'xe buýt', 'bus', 'máy bay', 'tàu', 'be', 'gojek', 'xanh sm'],
  shopping: ['quần áo', 'áo', 'quần', 'giày', 'dép', 'túi', 'shopee', 'lazada', 'tiki', 'mỹ phẩm', 'đồ gia dụng', 'nồi',
    'chảo', 'đồ dùng'],
  entertainment: ['phim', 'xem phim', 'netflix', 'spotify', 'youtube', 'game', 'karaoke', 'du lịch', 'concert', 'bowling'],
};

const KEYWORD_LIST = Object.entries(CATEGORY_KEYWORDS)
  .flatMap(([category, words]) => words.map(word => [word, category] as const))
  .sort((a, b) => b[0].length - a[0].length);

// Chữ thường, gom khoảng trắng, bỏ dấu câu — dùng chung cho so từ khoá và tra khoản cùng tên
export function normalizeItemName(item: string) {
  return item.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}.]+/gu, ' ').trim();
}

export function guessSharedCategory(item: string): string | null {
  const text = ` ${normalizeItemName(item)} `;
  return KEYWORD_LIST.find(([word]) => text.includes(` ${word} `))?.[1] ?? null;
}

// Tỉ lệ phần trăm để hiển thị: phần rất nhỏ ghi "<1%" thay vì làm tròn về 0%
export function formatPercent(part: number, total: number) {
  if (total <= 0 || part <= 0) return '0%';
  const percent = (part / total) * 100;
  return percent < 1 ? '<1%' : `${Math.round(percent)}%`;
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
