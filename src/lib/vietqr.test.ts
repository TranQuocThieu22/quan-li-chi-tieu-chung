import { describe, expect, it } from 'vitest';
import { buildVietQr, crc16, transferNote } from './vietqr';

// Tách chuỗi EMVCo thành { tag: value } (một tầng)
function parseTlv(payload: string) {
  const fields: Record<string, string> = {};
  for (let i = 0; i < payload.length; ) {
    const tag = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    fields[tag] = payload.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return fields;
}

describe('crc16', () => {
  it('đúng chuẩn CRC-16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1');
  });
});

describe('buildVietQr', () => {
  it('chuyển vào tài khoản, kèm số tiền và nội dung', () => {
    const payload = buildVietQr({ bin: '970436', account: '0123456789', amount: 903500, note: 'CHI TIEU T10' });
    const f = parseTlv(payload);
    expect(f['00']).toBe('01');
    expect(f['01']).toBe('12'); // có số tiền: mã dùng một lần
    expect(parseTlv(f['38'])).toEqual({ '00': 'A000000727', '01': '00069704360110' + '0123456789', '02': 'QRIBFTTA' });
    expect(parseTlv(parseTlv(f['38'])['01'])).toEqual({ '00': '970436', '01': '0123456789' });
    expect(f['53']).toBe('704');
    expect(f['54']).toBe('903500');
    expect(f['58']).toBe('VN');
    expect(parseTlv(f['62'])).toEqual({ '08': 'CHI TIEU T10' });
    // CRC tính trên cả chuỗi tới hết "6304"
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });

  it('không có số tiền thì là mã tĩnh, không có tag 54 và 62', () => {
    const f = parseTlv(buildVietQr({ bin: '971025', account: '0901234567' }));
    expect(f['01']).toBe('11');
    expect(f['54']).toBeUndefined();
    expect(f['62']).toBeUndefined();
  });

  it('làm tròn số tiền lẻ về đồng', () => {
    expect(parseTlv(buildVietQr({ bin: '970436', account: '1', amount: 1234.5 }))['54']).toBe('1235');
  });
});

describe('transferNote', () => {
  it('bỏ dấu, bỏ ký tự lạ, giới hạn độ dài cho app ngân hàng', () => {
    expect(transferNote('Chi tiêu chung tháng 10/2026 — Đà Lạt!')).toBe('Chi tieu chung thang 10 2026 Da Lat');
    expect(transferNote('a'.repeat(80))).toHaveLength(50);
  });
});
