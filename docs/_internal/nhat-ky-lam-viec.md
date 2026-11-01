# Nhật ký làm việc

> **Đây là chỗ ghi *hôm nay đã xảy ra gì*.** Mỗi phiên thêm một khối lên **đầu** danh sách,
> mới nhất nằm trên — ghi khi chủ sản phẩm nói *"ghi lại những gì đã làm"* hoặc *"đẩy
> production"* (xem *Mở và đóng phiên* trong [`AGENTS.md`](../../AGENTS.md)).
>
> **Vì sao cần:** `git log` kể được code đã đổi gì, nhưng không kể được *vì sao*, chủ sản phẩm
> đã yêu cầu gì, Claude kiểm được tới đâu và chỗ nào chưa ai nhìn tận mắt. Đây là file trả lời
> câu *"lần trước dừng ở đâu"*.
>
> **Không phải chỗ để:** việc chưa làm → [`viec-con-treo.md`](viec-con-treo.md). Đừng viết mục
> *Tiếp theo* ở đây — việc ghi rải trong nhật ký không ai gom lại, chìm dần.
>
> **Chỉ giữ hai ngày có ghi gần nhất.** Sang ngày thứ ba thì chuyển các khối cũ nhất xuống
> **đầu** file lưu trữ của tháng đó — `nhat-ky-lam-viec-YYYY-MM.md`, cùng thư mục, mới nhất
> nằm trên, không sửa chữ nào. Nhật ký không sửa lại quá khứ.
>
> Việc trước 28/10/2026 (chi tiêu cá nhân, ngân sách tháng, chọn nhiều, cài ra màn hình chính…)
> chưa có nhật ký — tra `git log`.

**Khuôn một khối** — hai mục, cố ý ít để còn viết nổi. Mục nào trống thì bỏ hẳn:

```markdown
## dd/mm/yyyy — nhãn ngắn

> Chủ sản phẩm: *"câu yêu cầu"* → *"câu tiếp theo"*.

**Đã làm**
- ...

**Quan sát**
- ...
```

Quan sát nào đòi một việc thì thêm dòng vào `viec-con-treo.md` ngay lúc ghi.

---

## 01/11/2026 — Cần thanh toán cộng nợ chưa trả của các tháng trước; sửa chữ tràn khỏi nút; lên production

> Chủ sản phẩm: *"Tháng này phải xem được với các tổng nợ tháng trước chưa thanh toán nữa cộng vào"* → *"đẩy production"* →
> (gửi ảnh điện thoại) *"Bị lỗi chữ ra ngoài nút"* → *"đẩy production"*.

**Đã làm**

- Commit *feat: carry unpaid debts from earlier months into this month*: thẻ *Cần thanh toán* (trang Sổ chung) tính nợ từ khoản chưa
  trả của tháng đang xem **cộng mọi khoản chưa trả có ngày trước tháng đó**, bù trừ một lượt (công nợ cộng được nên bằng tổng nợ
  từng tháng). Có nợ cũ thì hiện dòng *"Đã cộng nợ chưa trả của N tháng trước"* và nợ chia theo tháng (tháng cũ có liên kết sang
  tháng đó); mã VietQR lấy số tổng, nội dung *"Chi tieu chung den thang …"*; nút đổi thành *"Đã thanh toán xong tháng … và nợ
  tháng trước"*, đánh dấu cả khoản cũ. Tổng chi chung, Mỗi người, Đã chi trả, Theo danh mục vẫn chỉ tháng đang xem. Phần tính
  nợ tách ra `src/lib/debts.ts` (`settleDebts`, `groupByMonth`), 5 ca thử; 96/96.
- Kiểm ở máy (Postgres + seed, Chrome ẩn 390 px): tháng 11 ra 6.756.000 ₫ = 1.925.000 + 2.200.000 − 156.000 + 2.500.000 +
  287.000 (11, 10, 9, 7, 6); xem tháng 10 thì không cộng tháng 11; tháng 6 không có nợ cũ thì như trước. Bấm nút: 8 khoản sang đã
  trả, 8 dòng lịch sử `SETTLE`, sổ kia không đổi. `tsc`, lint, `next build` sạch.
- Commit *fix: keep the settle button label inside the button* (lượt đẩy thứ hai): trên điện thoại chủ sản phẩm, chữ *"Đã thanh
  toán xong tháng 11 và nợ tháng trước"* tràn hai bên nút vì `.btn` có `white-space: nowrap`. Có nợ cũ thì nút ghi *"Đã trả hết nợ
  đến tháng 11"* (prop `label` của `SettleMonthButton`; hộp xác nhận vẫn ghi đủ); `.btn-block` cho xuống dòng. Kiểm ở 360 px: chữ
  mới một dòng, chữ dài cũ xuống hai dòng trong nút.

**Quan sát**

- Tháng cũ (trước khi có nút thanh toán xong tháng 30/10) đã trả ngoài nhưng chưa đánh dấu sẽ hiện ra và bị cộng vào tổng —
  chủ sản phẩm đã được báo; nút ở trang tháng nào cũng đánh dấu luôn mọi tháng trước nó.

## 31/10/2026 — Ngân sách theo danh mục, sổ chung, cảnh báo 80%; danh mục Đồ uống, Tiền nhà; lên production

> Chủ sản phẩm: *"ngân sách đang hoạt động như thế nào"* → *"làm các này"* (ngân sách danh mục, cảnh báo khi sắp vượt, ngân sách
> sổ chung, lỗi đếm ngày theo UTC) → *"ăn uống đổi thành đồ ăn, thêm 1 loại đồ uống nữa nhé, giúp tôi cập nhật phần cũ nữa"* →
> *"loại tiền nhà nữa làm xong đẩy production"*.

**Đã làm**

- Commit *feat: category and shared budgets with 80% alerts*: bảng mới `PersonalCategoryBudget` (userId, category, month) và
  `SharedBudget` (partnershipId, month) — chỉ thêm bảng. `src/lib/budget.ts` (thuần, có test): `vietnamToday`, `daysLeftInMonth`,
  `pickBudget` (bản đặt ở tháng đó hoặc gần nhất trước, 0 = tắt), `budgetStatus` (≥80% sắp hết, chi > ngân sách là vượt — so số
  tiền, không so % đã làm tròn: 10.043.000/10.000.000 ra 100% nhưng là vượt). `src/lib/budget-server.ts` đọc ngân sách và gom cảnh
  báo tháng hiện tại. Trang *Ngân sách danh mục* (`/personal/budgets`), thẻ *Theo danh mục* hiện đã chi / ngân sách. Ngân sách sổ
  chung trong thẻ tổng trang Sổ chung, so với **mọi khoản trong tháng (kể cả đã trả, mua giùm)**; `BudgetEditor` nhận
  `partnershipId`. `BudgetAlerts`: trang Sổ chung một dòng mỗi sổ + một dòng gộp ngân sách cá nhân; trang Cá nhân chỉ sổ chung.
  Tháng mặc định (Sổ chung, Cá nhân, Thống kê, Nhật ký, `MonthSelector`) và số ngày còn lại theo giờ Việt Nam thay vì UTC.
- Commit *feat: split drinks and rent into their own categories*: "Ăn uống" → **Đồ ăn** (key `food` giữ nguyên), thêm **🧋 Đồ uống**
  (`drinks`, `DRINK_KEYWORDS`) và **🔑 Tiền nhà** (`rent`, `RENT_KEYWORDS`; trước nằm ở Nhà cửa / Hóa đơn) cho cả sổ chung lẫn cá
  nhân. Ca thử viết trước (91/91). `scripts/move-new-categories.mjs` chạy trong lệnh build (`… db push && tsx
  scripts/move-new-categories.mjs && next build`): khoản tạo trước 31/10 17:30 giờ VN đang ở danh mục cũ mà bộ đoán mới nhận ra
  thì chuyển, khoản sổ chung có lịch sử `UPDATE`; đã có khoản thuộc danh mục mới trước mốc thì bỏ qua. Thử ở máy: đồ uống 3 + 1,
  tiền nhà 1 cá nhân + 15 sổ chung, "Sửa vòi nước", "Tiền điện" giữ nguyên, lần hai bỏ qua; `npm run build` trọn ở máy.
- Seed: xoá `SharedBudget` trước `Partnership` (thứ tự sai làm seed hỏng giữa chừng), dữ liệu mẫu dùng `drinks`, `rent`.

**Quan sát**

- Lưới danh mục giờ 14 ô (sổ chung) / 10 ô (cá nhân) — hàng cuối lẻ.
- Cảnh báo ngân sách chỉ hiện khi mở app; thông báo đẩy về điện thoại chưa làm.
