import { z } from "zod";
const trimmed = (max) => z.string().trim().max(max);
const optionalText = (max) => z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), trimmed(max).optional());
export const phoneSchema = z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^\+?\d{7,15}$/, "Enter a valid phone number"));
const emailOptional = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().email("Enter a valid email").max(200).optional());
const dateOptional = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
    .refine((d) => !Number.isNaN(Date.parse(d)), "Use a valid date")
    .optional());
const quantity = z.coerce.number().int("Whole numbers only").min(1, "At least 1").max(100000);
/** Honeypot: real users never fill this hidden field. */
const honeypot = z.string().max(0).optional();
export const contactEnquirySchema = z.object({
    type: z.literal("contact"),
    customer_name: z.string().trim().min(2, "Enter your name").max(120),
    phone: phoneSchema,
    email: emailOptional,
    message: z.string().trim().min(5, "Tell us how we can help").max(2000),
    website: honeypot,
});
export const productEnquirySchema = z.object({
    type: z.literal("product"),
    customer_name: z.string().trim().min(2).max(120),
    phone: phoneSchema,
    product_id: z.string().uuid(),
    quantity: quantity.optional(),
    message: optionalText(2000),
    website: honeypot,
});
export const customPrintEnquirySchema = z.object({
    type: z.literal("custom_print"),
    customer_name: z.string().trim().min(2, "Enter your name").max(120),
    phone: phoneSchema,
    email: emailOptional,
    customization_details: z.string().trim().min(10, "Describe your project (at least 10 characters)").max(3000),
    quantity: quantity,
    material: optionalText(80),
    size_preference: optionalText(120),
    required_by: dateOptional,
    website: honeypot,
});
export const bulkEnquirySchema = z.object({
    type: z.literal("bulk_order"),
    customer_name: z.string().trim().min(2, "Enter your name").max(120),
    company_name: z.string().trim().min(2, "Enter company or organisation").max(160),
    phone: phoneSchema,
    email: emailOptional,
    product_name: z.string().trim().min(2, "What are you looking for?").max(200),
    quantity: quantity.pipe(z.number().min(10, "Bulk orders start at 10 pieces")),
    customization_details: optionalText(3000),
    required_by: dateOptional,
    website: honeypot,
});
// ---------- admin: catalogue ----------
const slug = z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only");
const csvList = z.preprocess((v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v), z.array(z.string().max(60)).max(30));
export const categorySchema = z.object({
    name: z.string().trim().min(2).max(120),
    slug,
    description: optionalText(1000),
    sort_order: z.coerce.number().int().min(0).max(9999).default(0),
    is_active: z.coerce.boolean().default(true),
    seo_title: optionalText(70),
    seo_description: optionalText(160),
});
export const productSchema = z
    .object({
    name: z.string().trim().min(2).max(200),
    slug,
    sku: optionalText(60),
    short_description: optionalText(300),
    description: optionalText(8000),
    price: z.coerce.number().min(0, "Price cannot be negative").max(10_000_000),
    sale_price: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(0).max(10_000_000).optional()),
    primary_category_id: z.string().uuid().nullable().optional(),
    material_options: csvList.default([]),
    color_options: csvList.default([]),
    size_options: csvList.default([]),
    dimensions: optionalText(120),
    weight_grams: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(0).optional()),
    print_duration: optionalText(80),
    lead_time: optionalText(120),
    availability: z.enum(["in_stock", "made_to_order", "limited", "out_of_stock"]).default("made_to_order"),
    stock_quantity: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(0).optional()),
    is_featured: z.coerce.boolean().default(false),
    is_popular: z.coerce.boolean().default(false),
    is_published: z.coerce.boolean().default(false),
    sort_order: z.coerce.number().int().min(0).max(9999).default(0),
    seo_title: optionalText(70),
    seo_description: optionalText(160),
})
    .refine((p) => p.sale_price == null || p.sale_price <= p.price, {
    path: ["sale_price"],
    message: "Sale price must not exceed the regular price",
});
export const enquiryStatusSchema = z.enum([
    "new",
    "contacted",
    "quotation_pending",
    "quotation_sent",
    "confirmed_outside_website",
    "completed",
    "closed",
]);
export const enquiryNoteSchema = z.object({
    enquiry_id: z.string().uuid(),
    body: z.string().trim().min(1, "Write a note").max(4000),
});
export const loginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(200),
});
export const galleryItemSchema = z.object({
    title: optionalText(120),
    caption: optionalText(300),
    alt_text: z.string().trim().min(2, "Describe the image").max(200),
    project_type: optionalText(60),
    sort_order: z.coerce.number().int().min(0).max(9999).default(0),
    is_published: z.coerce.boolean().default(true),
});
