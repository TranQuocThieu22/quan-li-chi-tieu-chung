// Đoán danh mục theo tên món; dùng được cả ở client và server, không import Prisma

// Chữ thường, gom khoảng trắng, bỏ dấu câu — dùng chung cho so từ khoá và tra khoản cùng tên
export function normalizeItemName(item: string) {
  return item.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}.]+/gu, ' ').trim();
}

// Bỏ dấu tiếng Việt: nội dung chuyển khoản ngân hàng thường viết không dấu ("Thanh toan tien dien")
export function stripDiacritics(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// Từ khoá bỏ dấu ngắn hơn ngần này dễ trùng nghĩa khác ("cho" là chợ hay cho, "an" là ăn hay an) — chỉ so khi có dấu
const MIN_ASCII_KEYWORD = 4;

// So nguyên từ, có dấu trước ("chợ" ≠ "cho", "sửa chữa" ≠ "sữa chua"), cụm dài trước nên "nhà hàng" thắng "nhà".
// Không khớp thì thử bản bỏ dấu, bỏ qua từ khoá ngắn và từ khoá mà bỏ dấu ra trùng giữa hai danh mục.
export function makeCategoryGuesser(keywords: Record<string, string[]>) {
  const byLength = (a: readonly [string, string], b: readonly [string, string]) => b[0].length - a[0].length;
  const exact = Object.entries(keywords)
    .flatMap(([category, words]) => words.map(word => [word, category] as const))
    .sort(byLength);

  const asciiOwners = new Map<string, Set<string>>();
  for (const [word, category] of exact) {
    const ascii = stripDiacritics(word);
    asciiOwners.set(ascii, (asciiOwners.get(ascii) ?? new Set()).add(category));
  }
  const ascii = [...asciiOwners.entries()]
    .filter(([word, owners]) => word.length >= MIN_ASCII_KEYWORD && owners.size === 1)
    .map(([word, owners]) => [word, [...owners][0]] as const)
    .sort(byLength);

  return function guess(item: string): string | null {
    const text = ` ${normalizeItemName(item)} `;
    const hit = exact.find(([word]) => text.includes(` ${word} `));
    if (hit) return hit[1];
    const plain = stripDiacritics(text);
    return ascii.find(([word]) => plain.includes(` ${word} `))?.[1] ?? null;
  };
}

// Tên món đã chuẩn hoá → danh mục của khoản gần nhất cùng tên. rows sắp mới nhất trước; bỏ "Khác" vì đó là
// mặc định (khoản chung tạo trước khi có danh mục đều là "Khác"), không phải lựa chọn thật.
export function buildKnownCategories(rows: { item: string; category: string }[]) {
  const known: Record<string, string> = {};
  for (const row of rows) {
    const key = normalizeItemName(row.item);
    if (key && row.category !== 'other' && !(key in known)) known[key] = row.category;
  }
  return known;
}
