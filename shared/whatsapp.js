import { formatINR } from "./format.js";
/** Default business WhatsApp number (international format). Used whenever none is saved in Admin > Settings. */
export const DEFAULT_WHATSAPP = "918939326710";

/** Digits only, no leading zeros/plus. Returns "" if it doesn't look like an international number. */
export function normalizeWhatsAppNumber(raw) {
    const digits = (raw ?? "").replace(/\D/g, "").replace(/^0+/, "");
    return digits.length >= 10 && digits.length <= 15 ? digits : "";
}
export function buildWhatsAppUrl(phone, message) {
    // Falls back to the default business number if none (or an invalid one) is configured.
    const number = normalizeWhatsAppNumber(phone) || DEFAULT_WHATSAPP;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
export function productEnquiryMessage(p) {
    return [
        "Hello Anu3D Prints!",
        "",
        "I am interested in the following product:",
        "",
        `Product: ${p.name}`,
        ...(p.sku ? [`SKU: ${p.sku}`] : []),
        ...(p.price != null ? [`Price shown: ${formatINR(p.price)}`] : []),
        `Product link: ${p.url}`,
        "",
        "Please share more details and customization options.",
    ].join("\n");
}
export function customPrintMessage(i) {
    return [
        "Hello Anu3D Prints!",
        "",
        "I would like a quotation for a custom 3D print.",
        "",
        ...(i.reference ? [`Enquiry ref: ${i.reference}`] : []),
        `Name: ${i.customerName}`,
        `Project: ${i.description}`,
        ...(i.quantity ? [`Quantity: ${i.quantity}`] : []),
        ...(i.material ? [`Preferred material: ${i.material}`] : []),
        ...(i.size ? [`Preferred size: ${i.size}`] : []),
        ...(i.requiredBy ? [`Required by: ${i.requiredBy}`] : []),
    ].join("\n");
}
export function bulkOrderMessage(i) {
    return [
        "Hello Anu3D Prints!",
        "",
        "I would like a quotation for a bulk order.",
        "",
        ...(i.reference ? [`Enquiry ref: ${i.reference}`] : []),
        `Company/Organisation: ${i.company}`,
        `Product/Gift type: ${i.item}`,
        `Quantity: ${i.quantity}`,
        ...(i.branding ? [`Branding: ${i.branding}`] : []),
        ...(i.requiredBy ? [`Required by: ${i.requiredBy}`] : []),
    ].join("\n");
}
export function generalMessage() {
    return "Hello Anu3D Prints! I would like to know more about your products and services.";
}
