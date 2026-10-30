import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/db';
import { hashImportToken } from '@/lib/import';
import { parseBankNotification } from '@/lib/notification-parser';

// Nhận thông báo giao dịch do MacroDroid (Android) chuyển tiếp. Không cần đăng nhập — xác thực bằng ?key= riêng của
// từng người (trang Cài đặt → Tự động nhập). Kẻ có mã chỉ thêm được mục vào hộp *chờ xác nhận* của người đó, không đọc được gì.

const FIELDS = ['app', 'title', 'text', 'big', 'time'] as const;
type Field = (typeof FIELDS)[number];
const MAX_TEXT = 2000;
// Cùng nội dung trong khoảng này coi là một (Android hay đăng lại thông báo); hai lần mua giống hệt cách xa hơn vẫn tách
const DEDUPE_WINDOW_MS = 2 * 60 * 1000;

// Dạng chữ theo dòng "khoá=giá trị": giá trị kéo dài tới dòng có khoá tiếp theo, nên chịu được xuống dòng và dấu ngoặc kép
// trong nội dung thông báo — thứ làm JSON ghép bằng magic text của MacroDroid bị hỏng.
function parseLines(body: string) {
  const result: Partial<Record<Field, string>> = {};
  let current: Field | null = null;
  for (const line of body.split(/\r?\n/)) {
    const key = line.match(/^(\w+)=/)?.[1] as Field | undefined;
    if (key && FIELDS.includes(key)) {
      current = key;
      result[key] = line.slice(key.length + 1);
    } else if (current) {
      result[current] += `\n${line}`;
    }
  }
  return result;
}

async function readFields(request: Request): Promise<Partial<Record<Field, string>>> {
  const body = await request.text();
  try {
    const json = JSON.parse(body);
    if (json && typeof json === 'object') {
      return Object.fromEntries(FIELDS.map(f => [f, json[f] == null ? undefined : String(json[f])]));
    }
  } catch {}
  if (/^\w+=/m.test(body)) return parseLines(body);
  return { text: body };
}

// Magic text không có giá trị thì MacroDroid để nguyên "{not_text_big}" — coi như trống
const clean = (value: string | undefined) =>
  value?.replace(/\{[a-z_]+\}/g, '').trim().slice(0, MAX_TEXT) || '';

export async function POST(request: Request) {
  const key = new URL(request.url).searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Thiếu key' }, { status: 401 });

  const user = await prisma.user.findFirst({ where: { importTokenHash: hashImportToken(key) }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'Key không hợp lệ' }, { status: 401 });

  const fields = await readFields(request);
  const source = clean(fields.app) || 'Không rõ';
  const title = clean(fields.title);
  // Nội dung mở rộng thường đủ hơn dòng rút gọn
  const text = clean(fields.big) || clean(fields.text);
  if (!text && !title) return NextResponse.json({ error: 'Thông báo trống' }, { status: 400 });

  const now = Date.now();
  const sentAt = Number(fields.time);
  // Giờ điện thoại lệch quá hai ngày thì dùng giờ nhận
  const occurredAt = new Date(Number.isFinite(sentAt) && Math.abs(sentAt - now) < 2 * 86_400_000 ? sentAt : now);

  // Có ngân hàng đặt số tiền ở tiêu đề, nên đọc cả hai
  const parsed = parseBankNotification(`${title}\n${text}`);
  // Quẹt thẻ ngoại tệ không có số VND nhưng vẫn vào hộp chờ để người dùng tự điền
  const status = parsed.direction === 'IN' && parsed.amount ? 'INCOMING'
    : parsed.amount || parsed.foreignAmount ? 'PENDING' : 'UNPARSED';
  const dedupeKey = createHash('sha256')
    .update([source, title, text, Math.floor(occurredAt.getTime() / DEDUPE_WINDOW_MS)].join('|'))
    .digest('hex');

  try {
    const saved = await prisma.importedTransaction.create({
      data: {
        userId: user.id,
        source,
        title: title || null,
        text,
        amount: parsed.amount,
        direction: parsed.direction,
        description: parsed.description,
        status,
        dedupeKey,
        occurredAt,
      },
    });
    return NextResponse.json({ ok: true, status, amount: saved.amount });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ error: 'Không lưu được' }, { status: 500 });
  }
}
