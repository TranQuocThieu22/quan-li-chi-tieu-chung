type Category = { readonly key: string; readonly label: string; readonly icon: string };

// Lưới chọn danh mục dùng cho form chi tiêu cá nhân và sổ chung
export default function CategoryPicker({
  categories,
  value,
  onChange,
  hint,
}: {
  categories: readonly Category[];
  value: string;
  onChange: (key: string) => void;
  hint?: string;
}) {
  return (
    <div className="form-group">
      <span className="label">Danh mục {hint && <span className="optional">({hint})</span>}</span>
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
