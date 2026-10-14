import { useActionState, useEffect } from "react";
import { useRouter } from "@/lib/nav";
import { toast } from "sonner";
import { deleteFaq, saveBusinessSettings, saveFaq, saveHomepageSection, saveSiteMessaging } from "@/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/fields";
import { Card } from "@/components/ui/misc";
function useToastState(state, refresh = true) {
    const router = useRouter();
    useEffect(() => {
        if (!state.message)
            return;
        if (state.ok) {
            toast.success(state.message);
            if (refresh)
                router.refresh();
        }
        else
            toast.error(state.message);
    }, [state, router, refresh]);
}
export function BusinessForm({ b }) {
    const [state, action, pending] = useActionState(saveBusinessSettings, {});
    useToastState(state);
    const e = state.fieldErrors ?? {};
    return (<form action={action}>
      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Business &amp; contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" htmlFor="name" error={e.name}><Input id="name" name="name" defaultValue={b.name} required/></Field>
          <Field label="Tagline" htmlFor="tagline"><Input id="tagline" name="tagline" defaultValue={b.tagline}/></Field>
          <Field label="Supporting message" htmlFor="support"><Input id="support" name="support" defaultValue={b.support}/></Field>
          <Field label="Location" htmlFor="location"><Input id="location" name="location" defaultValue={b.location}/></Field>
          <Field label="WhatsApp number" htmlFor="whatsapp" error={e.whatsapp} hint="International format, digits only (e.g. 919876543210)"><Input id="whatsapp" name="whatsapp" inputMode="numeric" defaultValue={b.whatsapp}/></Field>
          <Field label="Phone" htmlFor="phone"><Input id="phone" name="phone" defaultValue={b.phone}/></Field>
          <Field label="Email" htmlFor="email" error={e.email}><Input id="email" name="email" type="email" defaultValue={b.email}/></Field>
          <Field label="Business hours" htmlFor="hours"><Input id="hours" name="hours" defaultValue={b.hours}/></Field>
        </div>
        <Field label="Address" htmlFor="address"><Textarea id="address" name="address" defaultValue={b.address} className="min-h-20"/></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Instagram URL" htmlFor="instagram" error={e.instagram}><Input id="instagram" name="instagram" defaultValue={b.instagram} placeholder="https://instagram.com/..."/></Field>
          <Field label="Facebook URL" htmlFor="facebook" error={e.facebook}><Input id="facebook" name="facebook" defaultValue={b.facebook}/></Field>
          <Field label="Map / directions URL" htmlFor="map_url" error={e.map_url}><Input id="map_url" name="map_url" defaultValue={b.map_url}/></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo URL" htmlFor="logo_url" error={e.logo_url} hint="Public https:// image link. Leave blank to keep the current logo"><Input id="logo_url" name="logo_url" defaultValue={/^https:/i.test(b.logo_key) ? b.logo_key : ""} placeholder="https://.../anulogo.jpeg" /></Field>
          <Field label="Logo" htmlFor="logo" error={e.logo} hint="Or upload a file. JPEG, PNG or WebP"><Input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp"/></Field>
          <Field label="Favicon" htmlFor="favicon" error={e.favicon}><Input id="favicon" name="favicon" type="file" accept="image/jpeg,image/png,image/webp"/></Field>
        </div>
        <p className="text-xs text-muted-foreground">Currency is fixed to INR (₹).</p>
        <div className="flex justify-end"><Button type="submit" disabled={pending}>Save business settings</Button></div>
      </Card>
    </form>);
}
export function MessagingForm({ announcement, shipping, seo, maintenance }) {
    const [state, action, pending] = useActionState(saveSiteMessaging, {});
    useToastState(state);
    return (<form action={action}>
      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Announcement, shipping &amp; SEO</h2>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" name="announcement_enabled" defaultChecked={announcement.enabled} className="size-4"/> Show announcement bar</label>
        <Field label="Announcement text" htmlFor="announcement_text"><Input id="announcement_text" name="announcement_text" defaultValue={announcement.text} maxLength={200}/></Field>
        <Field label="Default lead-time message" htmlFor="lead_time_message"><Input id="lead_time_message" name="lead_time_message" defaultValue={shipping.lead_time_message}/></Field>
        <Field label="Shipping / pickup information" htmlFor="shipping_info"><Textarea id="shipping_info" name="shipping_info" defaultValue={shipping.info}/></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default SEO title" htmlFor="seo_title"><Input id="seo_title" name="seo_title" defaultValue={seo.title} maxLength={70}/></Field>
          <Field label="Default SEO description" htmlFor="seo_description"><Input id="seo_description" name="seo_description" defaultValue={seo.description} maxLength={160}/></Field>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" name="maintenance_enabled" defaultChecked={maintenance.enabled} className="size-4"/> Maintenance mode (public pages show a notice; /admin keeps working)</label>
        <div className="flex justify-end"><Button type="submit" disabled={pending}>Save</Button></div>
      </Card>
    </form>);
}
export function SectionForm({ section }) {
    const [state, action, pending] = useActionState(saveHomepageSection, {});
    useToastState(state);
    const c = section.content;
    return (<form action={action}>
      <Card className="space-y-3 p-4 sm:p-5">
        <input type="hidden" name="key" value={section.key}/>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold capitalize">{section.key.replaceAll("_", " ")}</h3>
          <div className="flex items-center gap-4">
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="is_visible" defaultChecked={section.is_visible} className="size-4"/> Visible</label>
            <label className="flex items-center gap-2 text-sm">Order <Input name="sort_order" type="number" min={0} defaultValue={section.sort_order} className="w-20" aria-label={`${section.key} order`}/></label>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Heading" htmlFor={`${section.key}-title`}><Input id={`${section.key}-title`} name="title" defaultValue={section.title ?? ""}/></Field>
          <Field label="Subheading" htmlFor={`${section.key}-sub`}><Input id={`${section.key}-sub`} name="subtitle" defaultValue={section.subtitle ?? ""}/></Field>
        </div>
        {section.key === "hero" ? (<div className="grid gap-3 sm:grid-cols-3">
            <Field label="Primary button" htmlFor="primary_cta"><Input id="primary_cta" name="primary_cta" defaultValue={c.primary_cta ?? ""}/></Field>
            <Field label="Secondary button" htmlFor="secondary_cta"><Input id="secondary_cta" name="secondary_cta" defaultValue={c.secondary_cta ?? ""}/></Field>
            <Field label="Hero image" htmlFor="hero_image"><Input id="hero_image" name="hero_image" type="file" accept="image/jpeg,image/png,image/webp"/></Field>
          </div>) : null}
        {section.key === "how_it_works" ? (<Field label="Steps" htmlFor="steps" hint="One per line: Title | description (max 6)"><Textarea id="steps" name="steps" defaultValue={(c.steps ?? []).map((s) => `${s.title} | ${s.body}`).join("\n")}/></Field>) : null}
        <div className="flex justify-end"><Button type="submit" size="sm" disabled={pending}>Save section</Button></div>
      </Card>
    </form>);
}
export function FaqForm({ faq }) {
    const [state, action, pending] = useActionState(saveFaq, {});
    useToastState(state);
    return (<form action={action} className="space-y-2 rounded-2xl border border-border bg-card p-4">
      {faq ? <input type="hidden" name="id" value={faq.id}/> : null}
      <Input name="question" defaultValue={faq?.question} placeholder="Question" aria-label="Question" required maxLength={200}/>
      <Textarea name="answer" defaultValue={faq?.answer} placeholder="Answer" aria-label="Answer" required className="min-h-20" maxLength={2000}/>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="is_published" defaultChecked={faq?.is_published ?? true} className="size-4"/> Published</label>
          <label className="flex items-center gap-2 text-sm">Order <Input name="sort_order" type="number" min={0} defaultValue={faq?.sort_order ?? 0} className="w-20"/></label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>{faq ? "Save" : "Add FAQ"}</Button>
          {faq ? <DeleteFaq id={faq.id}/> : null}
        </div>
      </div>
    </form>);
}
function DeleteFaq({ id }) {
    const router = useRouter();
    return (<Button type="button" size="sm" variant="ghost" className="text-danger" onClick={async () => {
            if (!confirm("Delete this FAQ?"))
                return;
            const r = await deleteFaq(id);
            if (r.ok) {
                toast.success(r.message);
                router.refresh();
            }
            else
                toast.error(r.message ?? "Failed");
        }}>Delete</Button>);
}
