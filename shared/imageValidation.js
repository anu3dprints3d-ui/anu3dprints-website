export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXT_FOR_TYPE = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
};
/** Detects the real image type from magic bytes - the browser-supplied type is never trusted. */
export function sniffImageType(bytes) {
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
        return "image/jpeg";
    if (bytes.length >= 8 &&
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b))
        return "image/png";
    if (bytes.length >= 12 &&
        String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...bytes.slice(8, 12)) === "WEBP")
        return "image/webp";
    return null;
}
export function checkImage(name, declaredType, bytes) {
    if (bytes.length === 0)
        return { ok: false, error: "The file is empty." };
    if (bytes.length > MAX_IMAGE_BYTES)
        return { ok: false, error: "Image is larger than 5 MB." };
    const sniffed = sniffImageType(bytes);
    if (!sniffed)
        return { ok: false, error: "Only JPEG, PNG or WebP images are allowed." };
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (!EXT_FOR_TYPE[sniffed].includes(ext))
        return { ok: false, error: "File extension does not match the image content." };
    if (declaredType && declaredType !== sniffed)
        return { ok: false, error: "File type does not match the image content." };
    return { ok: true, type: sniffed };
}
