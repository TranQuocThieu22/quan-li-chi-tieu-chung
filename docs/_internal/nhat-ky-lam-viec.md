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

## 30/10/2026 — Sửa `package-lock.json`; nâng Next 16.4.3; form nhập từ thông báo để trống tên món; xếp danh mục khoản cũ; mã VietQR nhận tiền; nút thanh toán xong tháng; Prisma 7; mẫu ACB, VCB thật; thẻ ngoại tệ vào hộp chờ; lên production

> Chủ sản phẩm: *"làm gì tiếp"* → *"Sửa package-lock.json để npm ci chạy được…"* → *"đẩy production"* → *"làm gì tiếp"* →
> *"làm đi"* (xem lỗ hổng `npm audit`) → *"đẩy production"* → *"làm gì tiếp"* → *"hiện tại nội dung tự động dài dòng không liên quan
> quá, bỏ để tôi tự nhập nội dung đi còn nội dung kia hiển thị thêm bên dưới để biết là món gì thôi"* → *"đẩy production"* →
> *"làm gì tiếp"* → *"bỏ này đi nhiều quá sao thêm hết, bạn chỉnh giúp được không: Chọn lại danh mục cho các khoản chi chung cũ"* →
> *"đẩy production rồi làm cho chức năng up tài khoản ngân hàng rồi QR của mình để người khác tiện chuyển"* → *"người trả và ngày
> mua tách xuống đi để chung 1 hàng mất chữ"* → *"đẩy production"* → *"làm gì tiếp"* → *"ổn rồi làm gì tiếp"* → *"làm đi"* →
> *"đẩy production"* → *"làm gì tiếp"* → *"làm prisma 7"* → *"đẩy production"* → *"làm gì tiếp"* →
> (gửi 3 ảnh mục Giao dịch của ACB ONE, 28–30/10) → *"đẩy production"* → (gửi 3 ảnh mục Biến động của VCB) →
> *"đẩy production"* → *"làm gì tiếp"* → *"làm đi"* (thẻ ngoại tệ vào *Chờ xác nhận*) → *"đẩy production"*.

**Đã làm**

- Commit *fix: restore platform packages dropped from package-lock.json*: kiểm từng phụ thuộc trong lockfile thì có 25 chỗ sai —
  `rolldown` thiếu 13 gói binding (macOS, ARM, musl…, chỉ còn hai gói khai tay trong `package.json`), `vite/node_modules/lightningcss`
  1.33.0 thiếu các `lightningcss-*` 1.33.0 nên rơi về bản 1.32.0 ở gốc, thiếu `fsevents`. Xoá các mục `rolldown`, `@rolldown/*`,
  `vite` rồi cho **npm 10** (`npx npm@10 install --package-lock-only`) tính lại → 0 lỗi. Chỉ đổi phiên bản `rolldown` và binding
  1.2.15 → 1.2.16 (trong khoảng vite cho phép); Next, React, Prisma, Tailwind giữ nguyên.
- README: đổi gói thì dùng `npx npm@10 install <gói>`; `npm ci` thì npm nào cũng được.
- Kiểm: `npm ci` (npm 11.6) trong dự án chạy được, không đổi lockfile; `npm test` 43/43; `tsc` sạch; lint sạch. **Chưa thử trên Linux**
  ở máy (Docker tắt) — build Vercel của lượt đẩy này là lần kiểm đầu; Vercel deploy thành công.
- Commit *fix: upgrade Next.js to 16.4.3 to patch security advisories* (lượt đẩy thứ hai): `npm audit` 11 → 3. Next 16.2.7 →
  16.4.3 cùng `eslint-config-next` (bản cũ dính RCE qua Image Optimization, SSRF, DoS Server Actions…; kéo theo `sharp` 0.35,
  `postcss` riêng của Next 8.5.23); `npx npm@10 audit fix` nâng `brace-expansion`, `browserslist`, `js-yaml`, `zod`,
  `baseline-browser-mapping` trong khoảng cho phép. Tài liệu nâng cấp 16.3/16.4 chỉ có tính năng tự bật — không sửa code.
  Kiểm: test 43/43, `tsc`, lint, `next build` sạch; `next start` với Postgres ở máy: chưa đăng nhập về `/login`, 9 trang đăng nhập
  trả 200, gửi thông báo mã sai → 401, thông báo ACB giả → 75.000 vào *Chờ xác nhận*. Vercel deploy thành công.
- Commit *feat: let people name imported payments themselves* (lượt đẩy thứ ba): mở form từ *Chờ xác nhận* thì ô tên món trống, con
  trỏ đặt sẵn ở đó; nội dung đọc từ thông báo hiện thành dòng `.field-note` *"Từ thông báo: …"* dưới ô, không lưu. Danh mục vẫn đoán
  từ nội dung thông báo (nhãn *theo nội dung thông báo*); gõ tên không đoán được thì giữ danh mục đó thay vì rơi về *Ăn uống*.
  `importPrefill` trả `description` thay cho `item`. Kiểm ở máy (Chrome ẩn, 390 px, cả *Sổ chung* lẫn *Cá nhân*): mở form, gõ
  tên lạ, gõ "cà phê" → *Ăn uống*, xoá trống → về *Hóa đơn*. Chưa bấm *Lưu* — phần gửi đi không đổi.
- Commit *chore: take the AGENTS.md block next dev 16.4 rewrites*: `next dev` bản 16.4 tự viết lại khối giữa
  `nextjs-agent-rules` (`node_modules/next/dist/server/lib/generate-agent-files.js`); commit để cây sạch, quy ước bên dưới không đổi.
  Vercel deploy thành công.
- Commit *feat: suggest categories for old shared expenses in one pass* (lượt đẩy thứ tư): máy Claude không vào được database
  production nên làm trang `/recategorize` thay vì sửa thẳng. Khoản chung `category = 'other'` tạo trước 29/10 14:00 giờ VN
  (`CATEGORIES_SINCE` trong `src/lib/recategorize.ts`; danh mục lên lúc 13:27) kèm đề xuất `proposeSharedCategory`: khoản cùng tên
  đã có danh mục, không thì từ khoá. Mỗi dòng một ô chọn, để *Khác* là không đổi; lưu qua `/api/expenses/bulk` (ghi lịch sử).
  Dòng nhắc trên trang chủ khi còn khoản đoán được; lưu xong đặt cookie `recategorized-<sổ>` để thôi nhắc. Thêm "vòi nước" vào
  Nhà cửa ("Sửa vòi nước" ra Hóa đơn vì "nước"; ca thử thêm trước). Kiểm ở máy với 52 khoản mẫu lùi `createdAt`: đổi đúng 52
  khoản, 52 dòng lịch sử `UPDATE`, khoản để Khác giữ nguyên, dòng nhắc mất. 46/46 test. **Vercel không tạo deployment** cho
  `0abbdca` (GitHub không có status/deployment, chờ 15 phút) — lên cùng lượt đẩy thứ năm.
- Commit *feat: show a VietQR to pay back whoever is owed* (lượt đẩy thứ năm): bảng mới `PaymentProfile` (`userId @unique` — bảng
  mới nên được; tách khỏi `User` để ảnh QR không tải theo mọi request): ngân hàng (BIN NAPAS, `src/lib/banks.ts` lấy từ
  api.vietqr.io/v2/banks, 48 ngân hàng/ví gồm MoMo, ZaloPay), số tài khoản, tên chủ tài khoản (in hoa không dấu), ảnh QR tự tải
  lên. Trang *Cài đặt → Nhận tiền* (`/admin/payment`, `PUT /api/payment-profile`). Thẻ *Cần thanh toán*: dòng nợ có người nhận đã cài
  thì có *Chuyển khoản cho …* mở mã VietQR điền sẵn số tiền + nội dung, số tài khoản/số tiền có nút *Chép*. `src/lib/vietqr.ts` tự
  dựng chuỗi EMVCo + CRC16, `qrcode` (MIT) vẽ SVG ở server — không gửi số tài khoản ra ngoài. 6 ca thử viết trước; chuỗi khớp từng
  ký tự với thư viện độc lập `vietnam-qr-pay` (cài ở thư mục nháp) ở 3 trường hợp. **Chưa ai quét bằng app ngân hàng thật.**
- Commit *fix: give each form field its own row*: *Người trả* / *Ngày mua* (form sổ chung) và *Số tài khoản* / *Chủ tài khoản*
  tách hàng vì ở 390 px tên bị cắt; bỏ `.form-row` (hết chỗ dùng). GitHub vẫn không có status, nhưng `vercel api /v6/deployments`
  cho thấy `8deb241` READY — Vercel deploy bình thường, chỉ ngừng báo về GitHub; `0abbdca` thì không có deployment riêng.
- Chủ sản phẩm thử trên điện thoại: *"ổn rồi"* (chuyển khoản QR, xếp danh mục, các trang) — xoá ba dòng ở việc còn treo.
- Commit *feat: settle a whole month in one tap* (lượt đẩy thứ sáu): nút *Đã thanh toán xong tháng N* trong thẻ *Cần thanh toán*
  (hiện khi còn nợ, cả khi người nhận chưa cài QR), hỏi lại kèm số khoản + tổng, gọi `/api/expenses/bulk` `settle` cho mọi
  khoản chưa trả của tháng đang xem. Kiểm ở máy: 8 khoản → đã trả, 8 dòng lịch sử `SETTLE`, thẻ về *Không ai nợ ai*. READY.
- Commit *chore: upgrade to Prisma 7* (lượt đẩy thứ bảy): 6.19.3 → 7.10.1 (bản ổn định; dist-tag `latest` trên npm đang là
  8.0.0-rc), `npm audit` 0 lỗ hổng. Generator `prisma-client` → `src/generated/prisma` (đã .gitignore sẵn), import
  `@/generated/prisma/client`; `src/lib/db.ts` dùng `@prisma/adapter-pg`; `prisma.config.ts` giữ url (không còn trong schema,
  không tự đọc .env); build `prisma generate && prisma db push && next build`, `db:push` thêm `prisma generate`; script `seed`,
  `dev:login` chạy qua `tsx`; seed xoá thêm `PaymentProfile` (lỗi có từ lượt VietQR). Schema không đổi bảng/cột. Kiểm ở máy: lệnh
  build của Vercel chạy trọn, `next start` 13 trang/API 200, thêm/sửa/xoá, notify (cả trùng), payment, bulk settle; `P2002` vẫn
  `instanceof Prisma.PrismaClientKnownRequestError`. Chưa thử được kết nối Neon thật ở máy (không có mật khẩu production).
  Vercel READY (`906adb7`); trên production `/api/import/notify?key=sai` trả 401 — app đọc được Neon qua `pg`.
- Commit *fix: tidy ACB transfer text in imported payments* (lượt đẩy thứ tám): 9 ca mới từ ảnh thật (đã thay số TK, họ tên,
  số điện thoại, mã QR) — có **tiền vào** `+ 450,000`, `+ 500,000`, tiền từ MoMo, nạp điện thoại, CK sang TK khác, QR Ministop.
  Số tiền và chiều tiền đúng cả 9 trước khi sửa; chỉ nội dung dài: bỏ `IB` / `IB QR<mã>` đầu, đuôi ` ddmmyy-hh:mm:ss <mã>` cách
  bằng khoảng trắng, đoạn lặp `, IB … CHUYEN KHOAN`. 60/60. **Vercel lại không deploy** `e739588` (như `0abbdca`) — lên cùng lượt sau.
- Commit *fix: read Vietcombank card and transfer notifications* (lượt đẩy thứ chín): 6 ca từ ảnh VCB thật (đã thay số TK, số thẻ,
  họ tên, mã). `Ref <TÊN>…` không có dãy mã chấm giờ đọc được; chuyển đi `…CT tu <TK> <TÊN> toi <TK> <NGƯỜI NHẬN> tai <NH>` lấy
  người nhận; thẻ "sử dụng tại … số tiền …" là tiền ra, cắt nội dung ở "số tiền"; "không thành công"/REJECTED bỏ qua; số tiền
  ngoại tệ ("22.22 USD") để *Không đọc được* thay vì lấy nhầm "Số dư TK trích nợ tạm tính …: 31,691VND" (`BALANCE_BEFORE` tới 6
  từ). 66/66. READY (`4a94056`, mang theo cả `e739588`).
- Commit *feat: queue foreign-currency card payments for a VND amount* (lượt đẩy thứ mười): bộ đọc trả thêm `foreignAmount`
  ("22.22 USD") và chiều tiền theo từ khoá; `notify` cho vào `PENDING` dù `amount` null; *Chờ xác nhận* và *Tự động nhập* hiện số
  ngoại tệ (đọc lại từ `text`, không đổi schema — `foreignAmountOf` trong `src/lib/import.ts`); form để trống, focus ô số tiền, dòng
  *"Thẻ trả 22.22 USD — nhập số tiền VND bị trừ"*; *Đưa lại vào chờ* bỏ điều kiện có số tiền. Kiểm ở máy: thông báo VCB USD → hộp
  chờ "22.22 USD" → form Cá nhân → lưu 588.000 → `ACCEPTED`. 66/66.
- Vercel: production và preview dùng **cùng** database Neon (`DATABASE_URL` pooler, `DATABASE_URL_UNPOOLED`) — ghi vào `AGENTS.md`.

**Quan sát**

- **Kiểm deploy bằng Vercel CLI**, không bằng commit status GitHub (ngừng từ 0abbdca): `npx -y vercel@latest api
  "/v6/deployments?projectId=quan-li-chi-tieu-chung&limit=3" --scope thieus-projects` → `readyState` + `meta.githubCommitSha`.
- npm 11.6 tính lại lockfile thì vẫn làm rơi các gói này, kể cả `npm install` không đổi gì (thử lại ra đúng 25 lỗi) — nên phải dùng npm 10.
- Lần chạy `npm ci` hôm 29/10 báo lệch nhưng sáng nay trên lockfile cũ lại chạy được; lỗi thật là các mục thiếu nói trên, `npm ci` không bắt.
- `npm audit` còn 3 lỗi high cùng gốc `deepmerge-ts` trong `@prisma/config` — chỉ `prisma` CLI kéo vào (`npm ls`), sửa phải lên
  Prisma 7; đã ghi vào việc còn treo.
