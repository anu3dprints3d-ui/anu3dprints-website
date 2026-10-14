import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client, } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { serverEnv } from "./env.js";
import { checkImage } from "../../shared/imageValidation.js";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "./limits.js";
let client;
function s3() {
    if (client)
        return client;
    const env = serverEnv();
    client = new S3Client({
        endpoint: env.SUPABASE_S3_ENDPOINT,
        region: env.SUPABASE_S3_REGION,
        forcePathStyle: true, // required by Supabase's S3 endpoint
        credentials: {
            accessKeyId: env.SUPABASE_S3_ACCESS_KEY_ID,
            secretAccessKey: env.SUPABASE_S3_SECRET_ACCESS_KEY,
        },
    });
    return client;
}
/**
 * Validates (magic bytes + extension + size), re-encodes to WebP (strips EXIF/metadata,
 * caps dimensions) and uploads to the public bucket under a random, unguessable key.
 */
export async function uploadPublicImage(file, folder) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkImage(file.name, file.type, bytes);
    if (!check.ok)
        return check;
    let processed;
    try {
        processed = await sharp(bytes, { limitInputPixels: 60_000_000 })
            .rotate()
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer({ resolveWithObject: true });
    }
    catch {
        return { ok: false, error: "This image could not be processed. Try a different file." };
    }
    const key = `${folder}/${randomUUID()}.webp`;
    try {
        await s3().send(new PutObjectCommand({
            Bucket: serverEnv().SUPABASE_S3_PUBLIC_BUCKET,
            Key: key,
            Body: processed.data,
            ContentType: "image/webp",
            CacheControl: "public, max-age=31536000, immutable",
        }));
    }
    catch (err) {
        console.error("S3 upload failed:", err instanceof Error ? err.name : "unknown");
        return { ok: false, error: "Upload to storage failed. Check storage configuration and try again." };
    }
    return { ok: true, key, width: processed.info.width, height: processed.info.height };
}
const PRIVATE_EXT = new Set(["stl", "step", "stp", "3mf", "png", "jpg", "jpeg", "webp", "pdf", "zip"]);
export const MAX_PRIVATE_BYTES = MAX_UPLOAD_BYTES;
/** Customer reference files go to the PRIVATE bucket. Never served publicly. */
export async function uploadPrivateFile(file, enquiryId) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!PRIVATE_EXT.has(ext))
        return { ok: false, error: `.${ext || "?"} files are not accepted.` };
    if (file.size === 0 || file.size > MAX_PRIVATE_BYTES)
        return { ok: false, error: `File must be under ${MAX_UPLOAD_MB} MB.` };
    const key = `enquiries/${enquiryId}/${randomUUID()}.${ext}`;
    try {
        await s3().send(new PutObjectCommand({
            Bucket: serverEnv().SUPABASE_S3_PRIVATE_BUCKET,
            Key: key,
            Body: new Uint8Array(await file.arrayBuffer()),
            ContentType: "application/octet-stream", // never let a browser sniff/execute it
            ContentDisposition: "attachment",
        }));
    }
    catch (err) {
        console.error("S3 private upload failed:", err instanceof Error ? err.name : "unknown");
        return { ok: false, error: "File upload failed." };
    }
    return { ok: true, key, name: file.name.slice(0, 200), contentType: file.type || "application/octet-stream", size: file.size };
}
export async function deletePublicObject(key) {
    if (!key)
        return;
    try {
        await s3().send(new DeleteObjectCommand({ Bucket: serverEnv().SUPABASE_S3_PUBLIC_BUCKET, Key: key }));
    }
    catch (err) {
        console.error("S3 delete failed:", err instanceof Error ? err.name : "unknown");
    }
}
/** Short-lived (5 min) signed URL for an admin to download a private customer file. */
export async function signPrivateUrl(key, filename) {
    return getSignedUrl(s3(), new GetObjectCommand({
        Bucket: serverEnv().SUPABASE_S3_PRIVATE_BUCKET,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename.replace(/[^\w.\- ]/g, "_")}"`,
    }), { expiresIn: 300 });
}
/** Used by the settings page and bootstrap script to verify real connectivity. */
export async function checkBuckets() {
    const env = serverEnv();
    const results = [];
    for (const bucket of [env.SUPABASE_S3_PUBLIC_BUCKET, env.SUPABASE_S3_PRIVATE_BUCKET]) {
        try {
            await s3().send(new HeadBucketCommand({ Bucket: bucket }));
            results.push({ bucket, ok: true });
        }
        catch (err) {
            results.push({ bucket, ok: false, error: err instanceof Error ? err.name : "Unknown error" });
        }
    }
    return results;
}
