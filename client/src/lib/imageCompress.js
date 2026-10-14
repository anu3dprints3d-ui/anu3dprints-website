import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@shared/imageValidation";

/** Largest original photo we will try to shrink (phone cameras produce 3-12 MB files). */
export const RAW_IMAGE_LIMIT = 25 * 1024 * 1024;

/** Largest file we will actually send: the server's image cap, and the host's request-size cap (4 MB on Netlify). */
export const MAX_SEND_BYTES = Math.min(MAX_IMAGE_BYTES, (__MAX_UPLOAD_MB__ - 0.4) * 1024 * 1024);

/**
 * Shrinks a photo in the browser (longest side 1600 px, WebP) so uploads are fast and fit the host's size limits.
 * Non-images and already-small files are returned untouched; any failure falls back to the original file.
 */
export async function compressImage(file, { maxSide = 1600, quality = 0.85 } = {}) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size < 250 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}
