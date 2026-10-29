// Thu nhỏ ảnh hóa đơn ngay trên máy trước khi lưu (chỉ chạy ở trình duyệt).
// Ảnh lưu thẳng vào database dạng base64 và trang chủ nhúng cả ảnh của tháng, nên ảnh gốc 3–5 MB làm trang nặng.
// Cạnh dài 1600 px, JPEG 0,8: thường còn 200–400 KB mà chữ trên hóa đơn vẫn đọc rõ.

const MAX_SIDE = 1600;
const QUALITY = 0.8;

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export async function compressImage(file: File): Promise<string> {
  const original = () => readAsDataUrl(file);

  let bitmap: ImageBitmap;
  try {
    // from-image: xoay theo EXIF như ảnh chụp dọc trên điện thoại
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Trình duyệt không đọc được (vd. HEIC trên Chrome) — giữ nguyên ảnh gốc
    return original();
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return original();
  }
  // Nền trắng: ảnh PNG có vùng trong suốt sang JPEG sẽ thành đen
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
  // Ảnh nhỏ sẵn (vd. ảnh chụp màn hình) nén lại có khi còn to hơn — lấy bản nhỏ hơn
  if (!blob || blob.size >= file.size) return original();
  return readAsDataUrl(blob);
}
