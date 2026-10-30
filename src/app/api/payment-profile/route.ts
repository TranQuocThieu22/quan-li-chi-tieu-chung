import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { findBank } from '@/lib/banks';
import { stripDiacritics } from '@/lib/guess-category';

// Ảnh QR đã được thu nhỏ ở trình duyệt (compressImage); chặn ảnh quá lớn làm nặng trang chủ của người cùng sổ
const MAX_QR_IMAGE_LENGTH = 2_000_000;

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

// Lưu tài khoản nhận tiền của chính mình; gửi trống hết thì xoá
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const bankBin = clean(body?.bankBin);
  const bankAccount = clean(body?.bankAccount).replace(/\s+/g, '');
  // App ngân hàng hiện tên chủ tài khoản in hoa không dấu; ghi theo đúng dạng đó để người chuyển dễ đối chiếu
  const accountName = stripDiacritics(clean(body?.accountName)).toUpperCase().replace(/\s+/g, ' ');
  const qrImage = clean(body?.qrImage);

  if (bankBin || bankAccount) {
    if (!findBank(bankBin)) return NextResponse.json({ error: 'Hãy chọn ngân hàng' }, { status: 400 });
    // Số tài khoản hoặc số điện thoại ví (MoMo, ZaloPay)
    if (!/^[0-9A-Za-z]{4,20}$/.test(bankAccount)) {
      return NextResponse.json({ error: 'Số tài khoản không hợp lệ' }, { status: 400 });
    }
  }
  if (accountName.length > 50) return NextResponse.json({ error: 'Tên chủ tài khoản quá dài' }, { status: 400 });
  if (qrImage && (!qrImage.startsWith('data:image/') || qrImage.length > MAX_QR_IMAGE_LENGTH)) {
    return NextResponse.json({ error: 'Ảnh mã QR không hợp lệ hoặc quá lớn' }, { status: 400 });
  }

  const data = {
    bankBin: bankAccount ? bankBin : null,
    bankAccount: bankAccount || null,
    accountName: accountName || null,
    qrImage: qrImage || null,
  };
  if (!data.bankAccount && !data.qrImage) {
    await prisma.paymentProfile.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ ok: true });
  }
  await prisma.paymentProfile.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data } });
  return NextResponse.json({ ok: true });
}
