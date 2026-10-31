# Nhật ký làm việc — 10/2026 (lưu trữ)

> Các khối đã quá hai ngày, chuyển nguyên văn từ [`nhat-ky-lam-viec.md`](nhat-ky-lam-viec.md). Mới nhất nằm trên.

---

## 29/10/2026 (lượt quảng cáo ACB) — Bộ đọc thông báo bỏ tin quảng cáo [QC], đọc nội dung chuyển khoản ACB ONE; lên production

> Chủ sản phẩm (gửi ảnh *Chờ xác nhận*): *"Thông báo khác bị lấy nhầm 400.000.000"* → *"đẩy production"* →
> (gửi ảnh nội dung thông báo chuyển khoản ACB ONE) → *"đẩy production"*.

**Đã làm**

- Commit *fix: skip bank ads when reading payment notifications*: ACB ONE đẩy tin *"[QC] THÊM HẠN MỨC – THÊM CHỦ ĐỘNG … Hạn mức
  lên đến 400.000.000đ"*, bộ đọc lấy làm khoản chi 400 triệu. Giờ thông báo có `[QC]`, `(QC)` hay mở đầu dòng bằng `QC:` thì
  *Không đọc được*; số đứng ngay sau "lên đến", "lên tới", "tối đa", "up to" bị bỏ như số dư. Thêm 3 ca thử từ ảnh trước khi sửa
  (3 ca đỏ → 41/41 xanh).
- Cùng commit: khoản 50.000 của ACB lấy nội dung *"khoan ACB: TK …(VND) - 50,000 luc 22:41 29/10/2026"* — chữ "tai" của
  "tai khoan" bị hiểu là "tại <cửa hàng>". Đã chặn; nội dung giờ để trống vì chưa biết ACB ONE ghi nội dung chuyển khoản ở đâu.
- Mục 400 triệu đã nằm trong *Chờ xác nhận* không tự mất — chủ sản phẩm bấm *Bỏ qua*.
- Commit *fix: read ACB ONE transfer content after GD:* (lượt đẩy thứ hai): mẫu thật *"Thong bao thay doi so du tai khoan —
  ACB: TK …(VND) - 50,000 luc 22:41 29/10/2026. So du 337,423. GD: <TÊN> CHUYEN KHOAN-291026-22:41:57 6302ASCB…"*. Nội dung lấy
  sau `GD:` trừ khi mở đầu bằng số hay +/- (MB viết "GD: -85,000VND"); cắt đuôi `-ddmmyy-hh:mm:ss <mã>`. 2 ca thử mới (mẫu thật
  đã che số tài khoản, thay tên; mẫu tiền vào "+ 1,200,000" do Claude viết, chưa thấy thật) → 43/43. Mục đã nhập giữ chữ cũ.

**Quan sát**

- `npm ci` ở máy Claude báo `package-lock.json` lệch `package.json` (thiếu các gói `lightningcss-*` theo nền tảng); chạy thử bằng
  `npm install --no-package-lock`, lockfile không đổi. Vercel vẫn build được nên chưa động tới.

## 29/10/2026 (lượt bộ thử và nén ảnh) — Thêm 4 danh mục sổ chung, bộ thử Vitest, nén ảnh hóa đơn; lên production

> Chủ sản phẩm: *"thanh toán thấy được rồi làm gì tiếp"* → *"làm đi, thêm vài loại danh mục nữa tùy bạn, thống kê hiện tại ổn"* →
> *"đẩy production"*.

**Đã làm**

- **Ngoài repo**: chủ sản phẩm đã cài MacroDroid trên Android, thanh toán thật đã hiện ở *Chờ xác nhận* trên production — đường
  điện thoại → `/api/import/notify` trên tên miền chính chạy được (Deployment Protection không chặn).
- Commit *feat: add health, travel, gifts and family to shared categories*: sổ chung 12 danh mục (lưới 4×3), *Khác* vẫn cuối;
  "du lịch", "máy bay" chuyển sang Du lịch; "con" đứng riêng không làm từ khoá (dễ trúng "con gà"); thêm "sữa chua" vào Đi chợ
  để bản bỏ dấu "sua chua" trùng với "sửa chữa" mà thôi đoán.
- Commit *feat: shrink receipt photos before saving them*: `src/lib/compress-image.ts` thu về cạnh dài 1600 px JPEG 0,8 (xoay
  theo EXIF, nền trắng cho PNG trong suốt), giữ ảnh gốc nếu không đọc được (HEIC) hoặc bản nén to hơn; nhận ảnh tới 25 MB, ảnh giữ
  nguyên vẫn giới hạn 5 MB; nút lưu hiện *Đang xử lý ảnh…*. Thử: PNG 16 MB 3000×2000 → JPEG 1600×1067, 429 KB.
- Commit *test: cover notification parsing and category guessing*: Vitest, `npm test`, 38 ca (11 thông báo mẫu, 27 ca đoán danh
  mục). `@types/node` 20 → 22 (Vitest 5 đòi). `AGENTS.md`: sửa bộ đọc / bộ đoán thì thêm ca vào test trước.
- Thống kê giữ cách tính hiện tại — mục *Chờ chủ sản phẩm quyết* hết việc.

**Quan sát**

- **npm 11 làm rơi gói biên dịch theo nền tảng của rolldown** khỏi `package-lock.json` (`Cannot find native binding`); gỡ cài lại
  không đỡ. Khai `@rolldown/binding-win32-x64-msvc` và `-linux-x64-gnu` trong `optionalDependencies` (máy khác nền tảng tự bỏ
  qua); nâng Vitest thì nâng hai gói này cùng phiên bản rolldown — ghi ở README. Lockfile so với HEAD: thêm 25 gói, không gỡ gói
  nào, Next/React/Prisma giữ nguyên; `postcss` 8.5.15 → 8.5.32 và vài gói phụ nâng bản vá theo.
- Bộ thử bắt được lỗi thật ngay lần chạy đầu ("sua chua" → Nhà cửa).
- CDP `DOM.setFileInputFiles` nhận đường dẫn Windows dạng `C:/…` với dấu `/`.

## 29/10/2026 (lượt tự động nhập) — Nhận thông báo ngân hàng, MoMo từ Android, hộp *Chờ xác nhận*; lên production

> Chủ sản phẩm: *"làm sao để liên kết ngân hàng hoạt momo để tự động tính chi tiêu"* → chọn *"2. Chuyển tiếp thông báo trên
> điện thoại"* → *"đẩy production"*.

**Đã làm**

- Tìm hiểu trước: Open API ngân hàng (Thông tư 64/2024/TT-NHNN, hiệu lực 01/03/2025) chỉ cho tổ chức có hợp đồng với ngân hàng;
  MoMo không có API đọc lịch sử ví cá nhân (các "API MoMo" trên mạng đòi thông tin đăng nhập ví — khuyên không dùng). Đưa ba
  cách: SePay (12 ngân hàng qua API, miễn phí 50 giao dịch/tháng, không có MoMo), chuyển tiếp thông báo Android, nhập file sao
  kê. Chủ sản phẩm chọn cách thứ hai.
- Commit *feat: import bank and MoMo payments from phone notifications*. Bảng `ImportedTransaction` + cột
  `User.importTokenHash` (SHA-256 của mã, mã gốc hiện một lần). `POST /api/import/notify?key=` nhận body dạng dòng
  `khoá=giá trị` (chịu được ngoặc kép, xuống dòng mà JSON ghép bằng magic text làm hỏng) hoặc JSON; magic text trống
  (`{not_text_big}`) coi như rỗng; gộp trùng trong 2 phút; tiền vào → `INCOMING`, không có số tiền → `UNPARSED`, còn lại
  `PENDING`. `src/lib/notification-parser.ts` đọc số tiền có dấu +/- (cần đơn vị hoặc dấu phân cách nghìn), bỏ số sau "số
  dư" (chỉ với số không dấu — VCB đặt số giao dịch có dấu ngay sau "Số dư TK"), chiều tiền theo từ khoá, nội dung từ `ND:` /
  `Nội dung:` / `Lời nhắn:` / `Ref …` / "cho …". Trang `/inbox` (*Chờ xác nhận*): *Sổ chung* / *Cá nhân* mở form điền sẵn
  (`?import=`), lưu xong gỡ khỏi hộp chờ và quay lại; *Bỏ qua*. Dòng nhắc ở trang chủ và Cá nhân. Trang *Liên kết → Tự động
  nhập*: tạo / tạo lại / tắt mã, chép URL và mẫu nội dung, hướng dẫn MacroDroid 5 bước, nút gửi thử, 20 thông báo gần nhất kèm
  nội dung gốc và *Đưa lại vào chờ*.
- Cùng commit: form chi tiêu cá nhân có gợi ý danh mục (bộ từ khoá riêng, khoản cùng tên trước đó). Bộ đoán tách ra
  `src/lib/guess-category.ts` dùng chung, thêm so **không dấu** cho nội dung chuyển khoản ("Thanh toan tien dien" → Hóa đơn),
  bỏ từ khoá bỏ dấu ngắn hơn 4 chữ hoặc trùng giữa hai danh mục ("cho", "sua chua"). Hook `useCategorySuggestion` cho cả hai form.

**Quan sát**

- **Bẫy schema**: đặt `@unique` cho `User.importTokenHash` làm `db push` đòi `--accept-data-loss` (bảng `User` đã có dữ liệu) —
  build Vercel không có cờ đó nên deploy sẽ hỏng. Đổi sang `@@index`; ghi vào `AGENTS.md` và `README.md`.
- Thử ở máy với thông báo giả lập kiểu VCB, MB, BIDV, Techcombank, VPBank, MoMo: đọc đúng cả. Lỗi bắt được khi thử: "thành
  công" bỏ dấu ra "thanh cong" khớp từ khoá tiền vào "cong" — bỏ "cong", "tang" đứng riêng. **Chưa thấy thông báo thật nào.**
- Gửi tiếng Việt bằng `curl` trong Git Bash làm hỏng vài chữ (ú, Nội) — tham số dòng lệnh bị đổi bảng mã; gửi qua `fetch` của
  Node thì đúng. Không phải lỗi app.
- Kịch bản thử từng xoá thẳng ô gợi ý cài app (React quản lý) rồi bấm `Link` → React lỗi `insertBefore` / `removeChild`. Tắt
  gợi ý bằng `localStorage` (`install-prompt-dismissed-at`) thay vì xoá phần tử.

## 29/10/2026 (lượt danh mục hàng loạt) — Đổi danh mục nhiều khoản một lúc, tự gợi ý danh mục theo tên món; lên production

> Chủ sản phẩm: *"làm gì tiếp"* → *"làm đi"* → *"đẩy production"*.

**Đã làm**

- Commit *feat: change the category of many expenses at once and suggest it from the name*. Route bulk thêm action `category`
  (kiểm danh mục hợp lệ, bỏ khoản đã đúng loại, ghi lịch sử `UPDATE` kèm `oldCategory`); thanh *Chọn nhiều* thêm nút **Danh mục**
  mở ngăn kéo từ đáy (`.sheet`) với lưới tám loại. Form thêm khoản chi chung tự chọn danh mục khi gõ tên: ưu tiên danh mục của
  khoản gần nhất cùng tên trong sổ (300 khoản gần nhất, bỏ *Khác*; trang `add` truyền xuống), không có thì đoán theo từ khoá
  (`guessSharedCategory` ở `src/lib/shared.ts` — so nguyên từ, có dấu, cụm dài trước); nhãn *(như lần trước)* / *(tự chọn theo
  tên món)*; bấm chọn tay thì thôi gợi ý.
- Commit *fix: show category shares under 1% as "<1%"* — `formatPercent` dùng ở trang chủ, Cá nhân, Thống kê.
- Commit *chore: bring the local database back up with Docker* — `restart: unless-stopped` trong `compose.yaml`.
- Sửa dòng `DATABASE_URL` trong `.env` (file không commit) sang database ở máy: `npm run build` ở máy chạy trọn, kể cả
  `prisma db push`. Ba khoá còn lại giữ nguyên.
- Bấm thử ở máy: 15 tên mẫu đoán đúng cả (kể cả *Sữa chua* → Đi chợ, *Ăn nhà hàng* → Ăn uống, *Quà cho mẹ* → không đoán); gợi ý
  *như lần trước* cho Tiền điện, Netflix, Tiền nhà; chọn tay rồi gõ tiếp không bị đổi. Đổi 2 khoản sang Đi chợ qua thanh *Chọn
  nhiều*: database và lịch sử đúng, ngăn kéo tự đóng; bốn nút vừa khít 390 px.

**Quan sát**

- **Claude tự làm sập Docker Desktop hai lần**: dọn tiến trình bằng `Stop-Process` lọc theo `CommandLine` trúng luôn các
  `bash.exe` của chính Claude (dòng lệnh chứa chuỗi đang lọc); Docker Desktop mở từ một shell đó nên chết theo, container
  `chi-tieu-db` thoát mã 255 giữa lúc thử. Dữ liệu còn nguyên (volume). Từ giờ chỉ tắt theo tên chương trình + PID/cổng.

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
