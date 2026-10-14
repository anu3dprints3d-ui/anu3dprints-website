import { z } from "zod";
import { SUPER_ONLY } from "../lib/auth.js";
import { deletePublicObject, uploadPublicImage } from "../lib/s3.js";
import { normalizeWhatsAppNumber } from "../../shared/whatsapp.js";
import { fail, friendlyDbError, logActivity, revalidatePublic, runAdminAction, succeed, zodFieldErrors } from "./helpers.js";
const text = (max) => z.string().trim().max(max);
const optionalUrl = z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Must start with http:// or https://");
const businessSchema = z.object({
    name: text(80).min(2),
    tagline: text(120),
    support: text(120),
    location: text(160),
    phone: text(30),
    email: z.string().trim().max(200).refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Enter a valid email"),
    address: text(300),
    hours: text(200),
    whatsapp: text(30).refine((v) => v === "" || normalizeWhatsAppNumber(v) !== "", "Use international format, e.g. 919876543210"),
    instagram: optionalUrl,
    facebook: optionalUrl,
    map_url: optionalUrl,
    logo_url: z.string().trim().max(500).refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), "Must be an https:// image URL").default(""),
});
export async function saveBusinessSettings(ctx, formData) {
    return runAdminAction(ctx, SUPER_ONLY, async (user) => {
        const parsed = businessSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success)
            return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error.issues));
        const supabase = ctx.supabase;
        const { data: current } = await supabase.from("site_settings").select("value").eq("key", "business").maybeSingle();
        const { logo_url, ...fields } = parsed.data;
        const value = { ...(current?.value ?? {}), ...fields, whatsapp: normalizeWhatsAppNumber(parsed.data.whatsapp), currency: "INR" };
        const staleKeys = [];
        if (logo_url && logo_url !== value.logo_key) {
            staleKeys.push(value.logo_key);
            value.logo_key = logo_url; // an uploaded file below still takes precedence
        }
        for (const [field, prop] of [["logo", "logo_key"], ["favicon", "favicon_key"]]) {
            const file = formData.get(field);
            if (file instanceof File && file.size > 0) {
                const up = await uploadPublicImage(file, "branding");
                if (!up.ok)
                    return fail(up.error, { [field]: up.error });
                staleKeys.push(value[prop]);
                value[prop] = up.key;
            }
        }
        const { error } = await supabase.from("site_settings").upsert({ key: "business", value, is_public: true, updated_by: user.id });
        if (error)
            return fail(friendlyDbError(error, "settings"));
        await Promise.all(staleKeys.filter((k) => k && !/^https:\/\//i.test(k)).map((k) => deletePublicObject(k)));
        await logActivity(ctx, "updated", "settings", "business");
        revalidatePublic();
        return succeed("Business settings saved.");
    });
}
const miscSchema = z.object({
    announcement_enabled: z.string().optional(),
    announcement_text: text(200),
    lead_time_message: text(300),
    shipping_info: text(600),
    seo_title: text(70),
    seo_description: text(160),
    maintenance_enabled: z.string().optional(),
});
export async function saveSiteMessaging(ctx, formData) {
    return runAdminAction(ctx, SUPER_ONLY, async (user) => {
        const parsed = miscSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success)
            return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error.issues));
        const d = parsed.data;
        const supabase = ctx.supabase;
        const { error } = await supabase.from("site_settings").upsert([
            { key: "announcement", value: { enabled: d.announcement_enabled === "on", text: d.announcement_text }, is_public: true, updated_by: user.id },
            { key: "shipping", value: { lead_time_message: d.lead_time_message, info: d.shipping_info }, is_public: true, updated_by: user.id },
            { key: "seo", value: { title: d.seo_title, description: d.seo_description }, is_public: true, updated_by: user.id },
            { key: "maintenance", value: { enabled: d.maintenance_enabled === "on" }, is_public: true, updated_by: user.id },
        ]);
        if (error)
            return fail(friendlyDbError(error, "settings"));
        await logActivity(ctx, "updated", "settings", "messaging");
        revalidatePublic();
        return succeed("Settings saved.");
    });
}
const sectionSchema = z.object({
    key: z.string().regex(/^[a-z_]+$/),
    title: text(120),
    subtitle: text(300),
    sort_order: z.coerce.number().int().min(0).max(999),
});
function parseSteps(textarea) {
    return textarea
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 6)
        .map((l) => {
        const [title, ...rest] = l.split("|");
        return { title: title.trim().slice(0, 80), body: rest.join("|").trim().slice(0, 240) };
    });
}
export async function saveHomepageSection(ctx, formData) {
    return runAdminAction(ctx, SUPER_ONLY, async (user) => {
        const parsed = sectionSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success)
            return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error.issues));
        const { key, title, subtitle, sort_order } = parsed.data;
        const supabase = ctx.supabase;
        const { data: current } = await supabase.from("homepage_sections").select("content").eq("key", key).maybeSingle();
        const content = { ...(current?.content ?? {}) };
        if (key === "hero") {
            content.primary_cta = text(40).parse(formData.get("primary_cta") ?? "");
            content.secondary_cta = text(40).parse(formData.get("secondary_cta") ?? "");
            const file = formData.get("hero_image");
            if (file instanceof File && file.size > 0) {
                const up = await uploadPublicImage(file, "branding");
                if (!up.ok)
                    return fail(up.error);
                await deletePublicObject(content.image_key);
                content.image_key = up.key;
            }
        }
        if (key === "how_it_works")
            content.steps = parseSteps(String(formData.get("steps") ?? ""));
        const { error } = await supabase
            .from("homepage_sections")
            .update({ title: title || null, subtitle: subtitle || null, sort_order, is_visible: formData.get("is_visible") === "on", content })
            .eq("key", key);
        if (error)
            return fail(friendlyDbError(error, "section"));
        await logActivity(ctx, "updated", "homepage section", key);
        revalidatePublic();
        return succeed(`"${key.replaceAll("_", " ")}" saved.`);
    });
}
const faqSchema = z.object({ question: text(200).min(3), answer: text(2000).min(3), sort_order: z.coerce.number().int().min(0).max(999).default(0) });
export async function saveFaq(ctx, formData) {
    return runAdminAction(ctx, SUPER_ONLY, async (user) => {
        const id = String(formData.get("id") ?? "");
        const parsed = faqSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success)
            return fail("Question and answer are required.", zodFieldErrors(parsed.error.issues));
        const row = { ...parsed.data, is_published: formData.get("is_published") === "on" };
        const supabase = ctx.supabase;
        const { error } = id ? await supabase.from("faqs").update(row).eq("id", id) : await supabase.from("faqs").insert(row);
        if (error)
            return fail(friendlyDbError(error, "FAQ"));
        await logActivity(ctx, id ? "updated" : "created", "faq", id || undefined);
        revalidatePublic();
        return succeed("FAQ saved.");
    });
}
export async function deleteFaq(ctx, id) {
    return runAdminAction(ctx, SUPER_ONLY, async (user) => {
        const supabase = ctx.supabase;
        const { error } = await supabase.from("faqs").delete().eq("id", id);
        if (error)
            return fail(friendlyDbError(error, "FAQ"));
        await logActivity(ctx, "deleted", "faq", id);
        revalidatePublic();
        return succeed("FAQ deleted.");
    });
}
