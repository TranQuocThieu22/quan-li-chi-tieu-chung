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

## 10/11/2026 — Ghi giùm khoản chưa biết giá, cảnh báo người trả vào điền

> Chủ sản phẩm: *"Bạn tôi hay quên note ấy tôi muốn note giùm bạn nhưng không biết giá tiền bao nhiêu bản ghi đó phải cảnh báo
> cho người đó để set lại khi vào app"* → *"đẩy production"*.

**Đã làm**

- Commit *feat: let a shared expense be noted before its amount is known*: cột mới `Expense.needsAmount` (Boolean, mặc định
  `false` — chỉ thêm cột có mặc định nên `db push` trên Vercel an toàn). Form sổ chung thêm ô tick *"Chưa biết số tiền — ghi
  giùm, để người trả điền sau"*: tick thì ô tiền để trống và thôi bắt buộc, lưu `amount = 0`; gõ số tiền vào là ô tick **tự bỏ**,
  người trả chỉ cần điền rồi lưu (một bước, không phải nhớ bỏ tick).
- `MissingAmountBanner` ở **đầu** trang Sổ chung, trên cả `ImportBanner`: lấy khoản `needsAmount` của **mọi tháng** chứ không
  riêng tháng đang xem (người ghi giùm không biết giá nên khoản này treo tới khi điền), liệt kê tối đa 5 dòng kèm ngày và
  *"Bạn trả"* / *"<tên> trả"*, bấm dòng nào sang `/edit/{id}` dòng đó. Hiện cho **cả hai người** trong sổ: người trả có thể chưa
  liên kết tài khoản, mà ai biết giá thì điền cũng được (Claude tự quyết, đã báo chủ sản phẩm).
- Khoản chưa có số tiền **không đánh dấu đã trả được**, để nó không bị quét sang *Đã trả* rồi mất luôn số tiền: ô *Đã trả* ở dòng
  chi mờ đi (`chip-btn.off`), `PATCH /api/expenses/[id]` trả 400, bulk `settle` bỏ qua, nút *"Đã trả hết nợ đến tháng …"* không
  gộp vào `toSettle`. `amount = 0` nên công nợ và tổng tháng không đổi; chỗ số tiền ghi *"Chưa có số tiền"* và dòng *"Chia 2 • …
  nợ …"* đổi thành *"Ghi giùm • chờ <tên> điền số tiền"*.
- `PUT /api/expenses/[id]` giờ đòi số tiền > 0 khi không còn cờ (trước không kiểm gì, `parseInt('')` ra NaN); bản app cũ đang mở
  không gửi cờ thì chỉ gỡ cờ khi đã có số tiền.
- Kiểm ở máy (Postgres + seed, Chrome ẩn 390 px): thêm *"Tien dien thang 11"* do Minh Anh trả, bỏ trống tiền → cảnh báo hiện đầu
  trang, dòng chi ghi *Chưa có số tiền*, ô *Đã trả* mờ, `PATCH` ra 400, bulk settle `count: 0`; vào *Sửa* gõ 520.000 ₫ → ô tick tự
  bỏ, cảnh báo biến mất, nợ tháng 11 từ 1.638.500 ₫ còn 1.378.500 ₫ và tổng 6.469.500 → 6.209.500 ₫. Xoá khoản thử sau khi kiểm.
  `tsc`, lint, `next build` sạch, 100/100.

**Quan sát**

- Cảnh báo chỉ nằm ở trang Sổ chung. Người trả mở thẳng tab *Cá nhân* thì không thấy — `/` là trang vào app nên tạm đủ.
- Thẻ *Khoản chi lớn nhất* ở Thống kê có thể liệt kê khoản 0 ₫ khi tháng có ít khoản (sắp xếp giảm dần nên thường không nổi lên).

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
