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

## 02/11/2026 — Mỗi khoản chưa trả ghi ai nợ bao nhiêu; trang Sổ chung gọn lại; gỡ script đổi danh mục khỏi build; lên production

> Chủ sản phẩm: (gửi ảnh chat góp ý của Tấn Anh — tưởng 361.000 ₫ ở đầu nhóm *Chưa trả* là số phải trả, *"app khó sài"*, *"thêm
> quá nhiều thông tin không cần thiết"*, *"chỗ này ở dưới lẽ ra nên thêm cái số tiền chia 2 nữa, dễ hiểu hơn"*) → *"đẩy production"* →
> *"làm gì tiếp"* → *"làm mục 1. Mục 2 làn theo gợi ý"* (gỡ script khỏi build; Sổ chung bớt thông tin theo gợi ý của Claude) →
> *"đẩy production"*.

**Đã làm**

- Commit *feat: show who owes what under each unpaid expense*: dưới dòng ngày / danh mục của khoản chưa trả thêm một dòng cam —
  khoản chung *"Chia 2 • Thiệu Trần Quốc nợ 147.500 ₫"* (nhiều người: *"A, B mỗi người nợ …"*), mua giùm *"… nợ 66.000 ₫"* (cả
  khoản). Khoản đã trả không hiện. Hàm `expenseShares` trong `src/lib/debts.ts`, cùng luật với `settleDebts` (người trả không còn
  trong sổ hoặc mua giùm chính mình thì không ai nợ), 4 ca thử; 100/100.
- Bỏ tổng tiền ở đầu nhóm *Chưa trả* / *Đã trả* của *Lịch sử chi tiêu* — là tổng hóa đơn, bị đọc nhầm thành số nợ (Claude tự
  quyết, đã báo chủ sản phẩm); số phải trả vẫn ở *Cần thanh toán*. `tsc`, lint sạch.
- Lượt đẩy thứ hai, commit *chore: drop the one-off category move from the build*: log build Vercel 31/10 đã có `move-new-categories:
  drinks — sổ chung 7 khoản (…)` nên gỡ script khỏi lệnh build và xoá file (`tsx` giữ cho `db:seed`, `dev:login`). Phần `rent` lần
  build nào cũng đọc database vì không có khoản nào để chuyển.
- Commit *feat: put what is owed first on the shared ledger page*: thứ tự trang Sổ chung giờ là *Cần thanh toán* (lấy nền `hero`) →
  thẻ tổng hai dòng (tổng chi chung, mỗi người) với ngân sách và *Đã chi trả* gấp trong `<details>` *"Ngân sách [N%] và ai đã chi"* →
  *Lịch sử chi tiêu*. Bỏ thẻ *Theo danh mục* khỏi trang chủ (Thống kê đã có). Cảnh báo vượt / sắp hết ngân sách vẫn ở `BudgetAlerts`.
- Kiểm ở máy (Postgres + seed, Chrome ẩn 390 px): không cuộn ngang; dòng *"Chia 2 • Minh Anh nợ 2.500.000 ₫"* một dòng; mở phần gấp
  thấy *Đặt ngân sách* và *Đã chi trả*. `tsc`, lint, 100/100.

**Quan sát**

- Log build 31/10 cho thấy *"súp cua + trà chanh"* và *"Hủ tiếu xào + xá xíu + trà"* bị chuyển sang Đồ uống dù chủ yếu là đồ ăn —
  chủ sản phẩm đã được báo, tự đổi tay.

- Tên dài thật như *"Thiệu Trần Quốc"* chưa xem trên điện thoại (dữ liệu mẫu tên ngắn).

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
