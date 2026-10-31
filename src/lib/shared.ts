import { makeCategoryGuesser, normalizeItemName } from './guess-category';

export { normalizeItemName } from './guess-category';

// Danh mục cho khoản chi trong sổ chung; dùng được cả ở client và server, không import Prisma

export const SHARED_CATEGORIES = [
  { key: 'food', label: 'Đồ ăn', icon: '🍜' },
  { key: 'drinks', label: 'Đồ uống', icon: '🧋' },
  { key: 'groceries', label: 'Đi chợ', icon: '🛒' },
  { key: 'rent', label: 'Tiền nhà', icon: '🔑' },
  { key: 'bills', label: 'Hóa đơn', icon: '🧾' },
  { key: 'home', label: 'Nhà cửa', icon: '🏠' },
  { key: 'transport', label: 'Di chuyển', icon: '🚗' },
  { key: 'shopping', label: 'Mua sắm', icon: '🛍️' },
  { key: 'entertainment', label: 'Giải trí', icon: '🎮' },
  { key: 'health', label: 'Sức khỏe', icon: '💊' },
  { key: 'travel', label: 'Du lịch', icon: '✈️' },
  { key: 'gifts', label: 'Quà tặng', icon: '🎁' },
  { key: 'family', label: 'Gia đình', icon: '👨‍👩‍👧' },
  // "Khác" luôn đứng cuối: getSharedCategory dùng nó làm mặc định
  { key: 'other', label: 'Khác', icon: '📦' },
] as const;

export function getSharedCategory(key: unknown) {
  return SHARED_CATEGORIES.find(c => c.key === key) ?? SHARED_CATEGORIES[SHARED_CATEGORIES.length - 1];
}

// Đồ uống dùng chung cho sổ chung và cá nhân. "trà" bỏ dấu chỉ 3 chữ nên chỉ khớp khi viết có dấu (không lẫn với "trả")
export const DRINK_KEYWORDS = ['đồ uống', 'nước uống', 'trà sữa', 'trà', 'trà đá', 'cà phê', 'cafe', 'coffee', 'bia',
  'rượu', 'nước ngọt', 'nước ép', 'sinh tố', 'soda', 'highlands', 'phúc long', 'starbucks', 'katinat'];

// Tiền nhà / trọ dùng chung cho sổ chung và cá nhân (trước 31/10 nằm ở Nhà cửa / Hóa đơn)
export const RENT_KEYWORDS = ['tiền nhà', 'thuê nhà', 'tiền thuê nhà', 'tiền phòng', 'thuê phòng', 'tiền trọ', 'phòng trọ',
  'nhà trọ'];

// Từ khoá đoán danh mục cho sổ chung (cách so ở makeCategoryGuesser)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['ăn', 'cơm', 'bún', 'phở', 'lẩu', 'pizza', 'gà rán', 'nướng', 'nhà hàng', 'bánh', 'kem', 'nhậu', 'đồ ăn',
    'buffet', 'snack'],
  drinks: DRINK_KEYWORDS,
  groceries: ['chợ', 'đi chợ', 'siêu thị', 'rau', 'thịt', 'cá', 'trứng', 'gạo', 'sữa', 'sữa chua', 'trái cây', 'hoa quả', 'bách hóa',
    'winmart', 'coopmart', 'co.op', 'lotte', 'big c', 'aeon'],
  bills: ['điện', 'nước', 'internet', 'wifi', 'mạng', 'gas', 'hóa đơn', 'cước', 'truyền hình', 'phí quản lý'],
  rent: RENT_KEYWORDS,
  home: ['nhà', 'phòng', 'nội thất', 'dọn dẹp', 'sửa nhà', 'sửa chữa', 'ống nước', 'vòi nước'],
  transport: ['xăng', 'grab', 'taxi', 'xe', 'gửi xe', 'rửa xe', 'xe buýt', 'bus', 'tàu', 'be', 'gojek', 'xanh sm'],
  shopping: ['quần áo', 'áo', 'quần', 'giày', 'dép', 'túi', 'shopee', 'lazada', 'tiki', 'mỹ phẩm', 'đồ gia dụng', 'nồi',
    'chảo', 'đồ dùng'],
  entertainment: ['phim', 'xem phim', 'netflix', 'spotify', 'youtube', 'game', 'karaoke', 'concert', 'bowling'],
  health: ['thuốc', 'nhà thuốc', 'pharmacity', 'long châu', 'khám', 'khám bệnh', 'bệnh viện', 'phòng khám', 'nha khoa',
    'bảo hiểm', 'vitamin'],
  travel: ['du lịch', 'khách sạn', 'homestay', 'resort', 'vé máy bay', 'máy bay', 'vietjet', 'vietnam airlines', 'bamboo',
    'agoda', 'booking', 'traveloka', 'vé tàu', 'tour'],
  gifts: ['quà', 'quà tặng', 'tặng', 'sinh nhật', 'mừng cưới', 'đám cưới', 'đám hỏi', 'lì xì', 'hoa', 'bó hoa'],
  // Không có "con" đứng riêng: "con gà", "con cá" là đi chợ
  family: ['biếu', 'bố mẹ', 'ba mẹ', 'ông bà', 'con cái', 'cho con', 'của con', 'học phí', 'sữa bột', 'bỉm', 'tã', 'đồ chơi', 'nhà trẻ', 'mầm non'],
};

export const guessSharedCategory = makeCategoryGuesser(CATEGORY_KEYWORDS);

// Danh mục đề xuất cho một khoản đang là "Khác": khoản cùng tên đã chọn trước đó (known, từ buildKnownCategories),
// không có thì đoán theo từ khoá; null nếu không đoán được
export function proposeSharedCategory(item: string, known: Record<string, string>) {
  return known[normalizeItemName(item)] ?? guessSharedCategory(item);
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
