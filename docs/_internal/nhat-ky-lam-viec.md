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

## 29/10/2026 (lượt chạy ở máy) — App chạy ở máy với Postgres trong Docker và dữ liệu mẫu, bấm thử mọi trang; lên production

> Chủ sản phẩm: *"làm gì tiếp"* → *"làm đi"* → *"đẩy production"*.

**Đã làm**

- Commit *chore: run the app locally against a seeded Postgres*. `compose.yaml` (Postgres 17, cổng **5544** — 5432 và 5433 đã
  có Postgres cài sẵn chiếm); `.env.local` (không commit) trỏ tới database ở máy kèm `AUTH_SECRET` riêng; lệnh `db:up`, `db:push`,
  `db:seed`, `dev:login` (chạy qua `node --env-file=.env.local`). `scripts/seed-local.mjs` xoá sạch rồi tạo 3 người dùng (người
  chính là superadmin), 2 sổ, ~6 tháng chi chung, một khoản có lịch sử sửa, chi tiêu cá nhân và ngân sách. `scripts/dev-login.mjs`
  in một dòng `document.cookie` để đăng nhập không qua Google — chạy tay ở máy, app không thêm route nào. Cả hai **từ chối chạy
  nếu `DATABASE_URL` không phải localhost**. Bỏ `dev.db`, `prisma/dev.db` khỏi git (đã `git rm` sẵn nên lọt vào commit *fix*
  bên dưới chứ không ở commit này — đã đẩy lên `main` nên để nguyên); `.gitignore` có dòng cuối bị ghi UTF-16
  (git không đọc được) — viết lại, thêm `*.db`. Viết lại `README.md`.
- Commit *fix: label edit and delete events on the history page*: trang Lịch sử hiện nhãn tiếng Anh *UPDATE* / *DELETE* vì
  `ACTION_LABELS` thiếu hai khoá — giờ là *SỬA* / *XÓA*. Có từ trước, lộ ra khi xem với dữ liệu thật ở máy.
- Bấm thử bằng Chrome ẩn qua DevTools Protocol, 390 px: thêm khoản mua giùm (người hưởng tự là người còn lại, kiểm trong
  database), sửa đổi người trả và danh mục (người hưởng đổi theo, `oldCategory` / `oldPayerName` / `oldBeneficiaryName` ghi đúng),
  khoản không tồn tại ra 404, bộ lọc *Chưa trả* giữ khi đổi tháng; Sổ chung, Thống kê, Cá nhân, Lịch sử, Liên kết, Nhật ký, Superadmin
  đều không tràn ngang.

**Quan sát**

- Docker Desktop đang tắt lúc bắt đầu — mở nó lên là daemon sẵn sau ~9 giây. Container `chi-tieu-db` để chạy tiếp cho chủ sản phẩm dùng.
- Prisma CLI không đè biến đã có trong môi trường, nên `node --env-file=.env.local …prisma db push` dùng đúng database ở máy dù
  `.env` vẫn trỏ SQLite (đã kiểm: *at "localhost:5544"*).
- Ô React điều khiển không nhận `el.value = …`; phải gọi setter của prototype rồi phát sự kiện `input` / `change`.

## 29/10/2026 (lượt thống kê) — Trang Thống kê có khoảng thời gian, biểu đồ theo tháng, danh mục, ai đã chi; lên production

> Chủ sản phẩm: *"làm sao cho thống kê có ý nghĩa hơn"* → *"đẩy production"*.

**Đã làm**

- Commit *feat: make the stats page answer where the shared money goes*. Viết lại `src/app/stats/page.tsx`: bộ lọc *6 tháng / 12
  tháng / Tất cả* (`?range=`, mặc định 6) cho cả trang; tổng chi chung + trung bình/tháng; ô *Tháng này* so với trung bình các
  tháng trước, ô *Tháng chi nhiều nhất*; biểu đồ cột theo tháng (tháng không chi gì vẫn có cột 0, đường trung bình, nhãn số chỉ ở
  tháng này, chạm cột hiện bong bóng số, *Xem bảng số liệu* để đọc đủ; vẽ tối đa 12 tháng); theo danh mục; *Ai đã chi* (thanh chia
  hai màu + %, mức chia đều); 5 khoản lớn nhất; mua giùm tách thẻ riêng.
- **Cách tính chi chung ở Thống kê**: mọi khoản không phải mua giùm, **tính cả khoản đã trả** — khác tổng ở trang chủ (chỉ khoản
  chưa trả); trang có dòng giải thích. Chờ chủ sản phẩm xác nhận (ở `viec-con-treo.md`).
- Biểu đồ làm bằng HTML/CSS trong Server Component, không thêm thư viện. Theo skill `dataviz`: cột ≤ 24 px bo 4 px ở đầu, lưới
  hairline liền, số lớn không dùng `tabular-nums`, màu theo người chứ không theo thứ hạng. Hai màu người (`--series-1` `#3987e5`,
  `--series-2` `#d95926`) chạy `validate_palette.js` trên nền `#131c2e`: qua cả năm kiểm, CVD ΔE 26,8.

**Quan sát**

- Chụp bằng bản sao tạm của trang với dữ liệu giả (7 tháng), 390 px: không tràn ngang; bong bóng ở cột mép trái / phải nằm gọn
  trong thẻ. Lần đầu nhãn *4,6tr* bị đường trung bình gạch ngang khi hai thứ trùng độ cao — thêm nền cùng màu thẻ cho nhãn.
- Chrome ẩn không cho trang nhận focus, `.focus()` không làm `:focus` khớp — phải bật `Emulation.setFocusEmulationEnabled` mới
  chụp được bong bóng.
- Chưa xem với dữ liệu thật.

## 29/10/2026 (lượt gộp form) — Một form chung cho thêm / sửa khoản chi sổ chung, hết lỗi lint; lên production

> Chủ sản phẩm: *"làm gì tiếp"* → *"làm đi"* → *"đẩy production"*.

**Đã làm**

- Đối chiếu nhật ký với git lúc mở phiên: ba commit từ 28/10 đều đã được kể. Sửa tiêu đề khối 28/10 thành *lên production sáng
  29/10* — commit `cd228d5` đẩy sáng 29/10, không phải 28/10.
- Commit *refactor: share one form between adding and editing shared expenses*. `SharedExpenseForm` (theo mẫu
  `PersonalExpenseForm`) thay hai form trùng nhau ở `add/page.tsx` và `edit/[id]/page.tsx`; hai trang thành Server Component, lấy
  thành viên và khoản chi trên server (bớt gần 600 dòng). Người được mua giùm tính lúc lưu (luôn là người còn lại) thay cho hai
  `useEffect` — hết 2 lỗi `react-hooks/set-state-in-effect`, lint còn 0 lỗi 0 cảnh báo. Đọc ảnh bằng `Promise.all` với cập nhật
  theo `prev`: bản cũ lấy `formData` lúc chọn ảnh, gõ tiếp trong lúc ảnh đang đọc thì chữ vừa gõ có thể mất.
- `parseImages` chuyển vào `src/lib/shared.ts`, trang chủ dùng chung.

**Quan sát**

- Đổi nhỏ về hành vi: trang sửa không còn chớp *Đang tải...*; khoản không tồn tại ra trang 404 thay vì hộp thông báo; chưa liên
  kết mà mở trang thêm khoản chi thì chuyển sang sổ cá nhân thay vì hiện thông báo trong trang.
- Chưa thử lưu thật (local không có database) — chỉ type-check, lint, build.

## 29/10/2026 (lượt nhật ký) — Lập nhật ký làm việc, việc còn treo và quy ước mở / đóng phiên; lên production

> Chủ sản phẩm: *"làm các file như nhật kí làm việc và việc còn treo như: D:\AQ-Project\BE\piano-learning nhé"* →
> *"đẩy production"*.

**Đã làm**

- Tạo `docs/_internal/viec-con-treo.md` và `docs/_internal/nhat-ky-lam-viec.md` theo cách làm của piano-learning, bản gọn hơn:
  việc còn treo chia bốn mục (chủ sản phẩm làm / chờ quyết / Claude làm khi được giao / khi tới mốc), nhật ký mỗi phiên một
  khối, giữ hai ngày. Ghi bù hai khối 28/10 và 29/10 từ chính các phiên đó; việc còn dở của hai lượt ấy đưa vào việc còn treo.
- `AGENTS.md` thêm mục *Mở và đóng phiên*: *"làm gì tiếp"* thì đối chiếu nhật ký với git trước; *"ghi lại những gì đã làm"* hay
  *"đẩy production"* thì ghi nhật ký, cập nhật việc còn treo, chuyển khối cũ, commit `docs(internal):` riêng.

**Quan sát**

- Piano-learning có thêm `lam-viec-hang-ngay.md`, `nhat-ky-quyet-dinh.md`, `bay-ky-thuat.md`… — chưa lập ở đây vì dự án nhỏ, quy
  ước đủ ngắn để nằm thẳng trong `AGENTS.md`.

## 29/10/2026 — Danh mục cho sổ chung, lọc và tách nhóm khoản đã trả; lên production

> Chủ sản phẩm: *"thêm option để ẩn những món đã trả và làm sao nhìn vào dễ nhìn hơn biết món nào còn và món nào đã trả, thêm
> danh mục loại cho chi tiêu chung nữa"* → *"commit và đẩy đi"*.

**Đã làm**

- **Danh mục cho khoản chi chung** — commit *feat: categorize shared expenses and filter settled ones*. Thêm cột
  `Expense.category` (mặc định `"other"`) và `ExpenseHistory.oldCategory` (null với bản ghi cũ); tám danh mục ở
  `src/lib/shared.ts`. Form thêm / sửa có lưới chọn danh mục, tách thành `CategoryPicker` dùng chung với form cá nhân. API
  nhận `category`, lọc qua `getSharedCategory`; `PUT` không gửi `category` (app cũ đang mở trên máy) thì giữ nguyên.
- Trang chủ có thẻ **Theo danh mục**, tính trên đúng tập khoản cộng vào tổng chi chung (chưa trả, không phải mua giùm). Trang
  Lịch sử hiện danh mục và so sánh khi danh mục đổi.
- **Bộ lọc Tất cả / Chưa trả / Đã trả** trên danh sách, nhớ theo từng máy (`localStorage` qua `useSyncExternalStore`, server luôn
  render *Tất cả*). *Chọn tất cả* chỉ chọn những khoản đang hiện.
- **Tách nhóm**: *Chưa trả* (chấm vàng, tổng tiền vàng) nằm trên, *Đã trả* (chấm xanh) nằm dưới, ngăn bằng gạch đứt. Khoản đã
  trả mờ 50%, số tiền gạch ngang, icon danh mục có dấu ✓ xanh; nút thao tác giữ nguyên độ rõ. Avatar đổi từ chữ cái người trả
  sang icon danh mục; tên người trả vẫn ở dòng phụ.
- Vercel build chạy `prisma db push`, thêm hai cột vào database production; deploy báo thành công.

**Quan sát**

- Chỉ chụp được danh sách khoản chi (dữ liệu giả, khổ 390 px, chế độ *Tất cả*) — form chọn danh mục, thẻ *Theo danh mục*, trang
  Lịch sử chưa ai nhìn tận mắt.
- Mọi khoản chi chung cũ hiện là 📦 Khác cho tới khi sửa lại.

## 28/10/2026 — Làm lại toàn bộ giao diện cho điện thoại; lên production sáng 29/10

> Chủ sản phẩm: *"update lại toàn bộ styles giao diện cho nhìn đẹp, hợp lí gọn gàng hơn cho mobile"* → *"đẩy production"*.

**Đã làm**

- Commit *feat: redesign UI for mobile*. Viết lại `globals.css` thành bộ style dùng chung (token màu, thẻ, nút, form, danh sách,
  badge, thanh tiến độ), chuyển gần hết inline style trong các trang sang class.
- **Thanh điều hướng dưới** (`BottomNav`: Sổ chung, Cá nhân, Thống kê, Liên kết) thay hàng bốn nút ở đầu trang; chưa liên kết thì
  ẩn Sổ chung và Thống kê. Trong khu cài đặt chỉ hiện trên điện thoại.
- `PageHeader` chung: tiêu đề trái, nút *+ Thêm* phải, nút quay lại thay nút *Hủy*. Ô chọn sổ chuyển vào phụ đề (*với Minh Anh ▾*);
  bỏ link *+ Liên kết thêm* vì đã có mục Liên kết ở thanh dưới.
- Chọn tháng có nút tháng trước / sau; trên điện thoại bảng chọn trượt lên từ đáy.
- Form: ô số tiền to, đứng đầu; *Người trả* và *Ngày* chung một hàng; danh mục cá nhân thành lưới 4 cột có emoji; chữ trong ô nhập
  16 px để iPhone không tự phóng to.
- Trang Cá nhân thay thẻ *Tổng chi tiêu cá nhân* (trùng với thẻ trên) bằng hai ô nhỏ: tháng này (▲/▼ %) và tháng trước. Thống kê
  có thanh tỉ lệ. Trang Lịch sử thành dòng thời gian, mỗi lần sửa chỉ hiện trường đã đổi. Đăng nhập có logo và nút Google nền trắng.
- `viewportFit: 'cover'` để dùng được `env(safe-area-inset-*)` trên iPhone; đổi màu theme sang `#0b1120` ở layout và manifest.

**Quan sát**

- Local không chạy được với dữ liệu (`.env` trỏ SQLite, schema là Postgres). Kiểm giao diện bằng một route tạm
  `/login/preview` (proxy bỏ qua xác thực với `/login/*`) với dữ liệu giả, chụp bằng Chrome ẩn qua DevTools Protocol ở 390 px — đã xoá
  route sau khi chụp. Chrome ẩn có độ rộng cửa sổ tối thiểu ~500 px: chụp bằng `--window-size=390` cho ảnh bị cắt như tràn ngang,
  phải dùng `Emulation.setDeviceMetricsOverride` mới đúng.
- Lần chụp đầu, hàng bốn nút dưới khoản chi (*Đã trả, Sửa, Lịch sử, Xóa*) rớt *Xóa* xuống dòng ở 390 px — giảm padding nút là vừa.
