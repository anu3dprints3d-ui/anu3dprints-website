import { z } from "zod";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "../lib/supabase.js";
import { rateLimit } from "../lib/rateLimit.js";
import { uploadPrivateFile } from "../lib/s3.js";
import { bulkEnquirySchema, contactEnquirySchema, customPrintEnquirySchema, productEnquirySchema, } from "../../shared/schemas.js";
import { buildWhatsAppUrl, bulkOrderMessage, customPrintMessage, productEnquiryMessage } from "../../shared/whatsapp.js";
import { formatDate } from "../../shared/format.js";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "../lib/limits.js";
const schema = z.discriminatedUnion("type", [
    contactEnquirySchema,
    productEnquirySchema,
    customPrintEnquirySchema,
    bulkEnquirySchema,
]);
const MAX_FILES = 3;
/**
 * Public enquiry endpoint. Validates, rate-limits, stores the enquiry in Postgres FIRST,
 * and only then returns a WhatsApp link. If storing fails we say so and return no link.
 */
export async function submitEnquiry(ctx, formData) {
    const ip = ctx.ip;
    const limited = rateLimit(`enquiry:${ip}`, 5, 10 * 60_000);
    if (!limited.ok) {
        return { ok: false, error: `Too many requests. Please try again in ${Math.ceil(limited.retryAfterSeconds / 60)} minute(s).` };
    }
    const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        const fieldErrors = {};
        for (const issue of parsed.error.issues)
            fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
        return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
    }
    const data = parsed.data;
    // Honeypot tripped -> pretend success to the bot, store nothing.
    if ("website" in data && data.website) {
        return { ok: true, reference: "A3D-0000", whatsappUrl: "https://wa.me/" };
    }
    const files = formData.getAll("files").filter((f) => f instanceof File && f.size > 0);
    if (files.length > MAX_FILES)
        return { ok: false, error: `Attach at most ${MAX_FILES} files.` };
    if (files.reduce((n, f) => n + f.size, 0) > MAX_UPLOAD_BYTES)
        return { ok: false, error: `Attached files must total ${MAX_UPLOAD_MB} MB or less. For bigger files, send them to us on WhatsApp.` };
    const db = createAdminClient();
    const { data: biz } = await db.from("site_settings").select("value").eq("key", "business").maybeSingle();
    const phone = biz?.value?.whatsapp || process.env.WHATSAPP_PHONE_NUMBER || "";
    const id = randomUUID();
    let productName = null;
    let productRow = null;
    if (data.type === "product") {
        const { data: p } = await db
            .from("products")
            .select("id,name,sku,price,slug")
            .eq("id", data.product_id)
            .eq("is_published", true)
            .is("archived_at", null)
            .maybeSingle();
        if (!p)
            return { ok: false, error: "That product is no longer available." };
        productRow = p;
        productName = p.name;
    }
    const row = {
        id,
        type: data.type,
        customer_name: data.type === "contact" || data.type === "product" || data.type === "custom_print" || data.type === "bulk_order" ? data.customer_name : "",
        phone: data.phone,
        email: "email" in data ? (data.email ?? null) : null,
        company_name: data.type === "bulk_order" ? data.company_name : null,
        product_id: productRow?.id ?? null,
        product_name: data.type === "bulk_order" ? data.product_name : productName,
        quantity: "quantity" in data ? (data.quantity ?? null) : null,
        material: data.type === "custom_print" ? (data.material ?? null) : null,
        size_preference: data.type === "custom_print" ? (data.size_preference ?? null) : null,
        required_by: "required_by" in data ? (data.required_by ?? null) : null,
        customization_details: "customization_details" in data ? (data.customization_details ?? null) : null,
        message: "message" in data ? (data.message ?? null) : null,
    };
    const { data: inserted, error } = await db.from("enquiries").insert(row).select("reference").single();
    if (error || !inserted) {
        console.error("Enquiry insert failed:", error?.code);
        return { ok: false, error: "We could not save your enquiry right now. Please try again in a moment, or message us on WhatsApp directly." };
    }
    let skipped = 0;
    for (const file of files) {
        const up = await uploadPrivateFile(file, id);
        if (!up.ok) {
            skipped++;
            continue;
        }
        await db.from("enquiry_files").insert({
            enquiry_id: id,
            storage_key: up.key,
            original_name: up.name,
            content_type: up.contentType,
            size_bytes: up.size,
        });
    }
    const reference = inserted.reference;
    const origin = process.env.SITE_URL ?? "";
    let message;
    if (data.type === "product" && productRow) {
        message =
            productEnquiryMessage({ name: productRow.name, sku: productRow.sku, price: productRow.price, url: `${origin}/products/${productRow.slug}` }) +
                `\n\nEnquiry ref: ${reference}` +
                (data.quantity ? `\nQuantity: ${data.quantity}` : "");
    }
    else if (data.type === "custom_print") {
        message = customPrintMessage({
            reference,
            customerName: data.customer_name,
            description: data.customization_details,
            quantity: data.quantity,
            material: data.material,
            size: data.size_preference,
            requiredBy: data.required_by ? formatDate(data.required_by).split(",")[0] : null,
        });
        if (files.length)
            message += `\nReference files uploaded: ${files.length - skipped}`;
    }
    else if (data.type === "bulk_order") {
        message = bulkOrderMessage({
            reference,
            company: data.company_name,
            item: data.product_name,
            quantity: data.quantity,
            branding: data.customization_details,
            requiredBy: data.required_by,
        });
    }
    else {
        message = `Hello Anu3D Prints! My name is ${data.customer_name}. Enquiry ref: ${reference}.`;
    }
    return { ok: true, reference, whatsappUrl: buildWhatsAppUrl(phone, message) };
}
