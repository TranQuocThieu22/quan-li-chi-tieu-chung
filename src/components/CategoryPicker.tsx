type Category = { readonly key: string; readonly label: string; readonly icon: string };

// Lưới chọn danh mục dùng cho form chi tiêu cá nhân và sổ chung
export default function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: readonly Category[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="form-group">
      <span className="label">Danh mục</span>
      <div className="option-grid">
        {categories.map(c => (
          <button
            key={c.key}
            type="button"
            className="option-btn"
            aria-pressed={value === c.key}
            onClick={() => onChange(c.key)}
          >
            <span className="emoji" aria-hidden>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
