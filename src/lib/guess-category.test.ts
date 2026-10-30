import { describe, expect, it } from 'vitest';
import { buildKnownCategories, normalizeItemName } from './guess-category';
import { guessSharedCategory, proposeSharedCategory } from './shared';
import { guessPersonalCategory } from './personal';

describe('guessSharedCategory', () => {
  it.each([
    ['Tiền điện tháng 10', 'bills'],
    ['Đi chợ', 'groceries'],
    ['Siêu thị cuối tuần', 'groceries'],
    ['Sữa chua', 'groceries'],
    ['Sửa chữa vòi nước', 'home'],
    ['Sửa vòi nước', 'home'],
    ['Tiền nhà', 'home'],
    ['Ăn nhà hàng', 'food'],
    ['Trà sữa', 'food'],
    ['Grab về quê', 'transport'],
    ['Netflix', 'entertainment'],
    ['Mua nồi chiên', 'shopping'],
    ['Vé máy bay Đà Nẵng', 'travel'],
    ['Khách sạn Vũng Tàu', 'travel'],
    ['Quà sinh nhật', 'gifts'],
    ['Biếu bố mẹ', 'family'],
    ['Mua con gà', null],
    ['Nhà thuốc Long Châu', 'health'],
    ['Quà cho mẹ', 'gifts'],
    ['Thanh toán', null],
  ])('%s → %s', (item, expected) => {
    expect(guessSharedCategory(item)).toBe(expected);
  });

  it('đọc được nội dung chuyển khoản không dấu', () => {
    expect(guessSharedCategory('Thanh toan tien dien thang 10')).toBe('bills');
    expect(guessSharedCategory('Thanh toan Shopee don hang 123')).toBe('shopping');
    expect(guessSharedCategory('GRAB*A-123 Grab ve que')).toBe('transport');
  });

  it('không đoán theo từ khoá bỏ dấu ngắn hoặc trùng nghĩa', () => {
    // "cho" có thể là "chợ" hay "cho"; "sua chua" là "sữa chua" hay "sửa chữa"
    expect(guessSharedCategory('qua cho me')).toBeNull();
    expect(guessSharedCategory('sua chua')).toBeNull();
  });
});

describe('guessPersonalCategory', () => {
  it.each([
    ['Phúc Long Coffee & Tea', 'food'],
    ['Đi chợ', 'food'],
    ['Thuốc cảm', 'health'],
    ['Học phí tiếng Anh', 'education'],
    ['Tiền nhà', 'bills'],
  ])('%s → %s', (item, expected) => {
    expect(guessPersonalCategory(item)).toBe(expected);
  });
});

describe('buildKnownCategories', () => {
  it('lấy khoản gần nhất cùng tên, bỏ "Khác"', () => {
    const known = buildKnownCategories([
      { item: 'Tiền điện', category: 'bills' },
      { item: 'tiền  điện', category: 'home' },
      { item: 'Quà', category: 'other' },
    ]);
    expect(known[normalizeItemName('Tiền điện')]).toBe('bills');
    expect(known[normalizeItemName('Quà')]).toBeUndefined();
  });
});

describe('proposeSharedCategory', () => {
  const known = buildKnownCategories([{ item: 'Bánh mì cô Ba', category: 'groceries' }]);

  it('ưu tiên danh mục của khoản cùng tên đã chọn trước đó', () => {
    // Từ khoá "bánh" sẽ đoán Ăn uống, nhưng khoản cùng tên đã được chọn Đi chợ
    expect(proposeSharedCategory('bánh mì  cô ba', known)).toBe('groceries');
  });

  it('không có khoản cùng tên thì đoán theo từ khoá, không đoán được thì null', () => {
    expect(proposeSharedCategory('Tiền điện tháng 9', known)).toBe('bills');
    expect(proposeSharedCategory('Linh tinh', known)).toBeNull();
  });
});
