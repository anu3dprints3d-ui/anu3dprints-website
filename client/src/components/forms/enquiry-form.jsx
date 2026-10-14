import { useRef, useState, useTransition } from "react";
import { CheckCircle2, Loader2, MessageCircle, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { submitEnquiry } from "@/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { compressImage } from "@/lib/imageCompress";
const MATERIALS = ["PLA", "PETG", "ABS", "TPU (flexible)", "Not sure - advise me"];
export function EnquiryForm({ type, productId, submitLabel }) {
    const formRef = useRef(null);
    const [pending, startTransition] = useTransition();
    const [result, setResult] = useState(null);
    const [fileNote, setFileNote] = useState("");
    const errors = result && !result.ok ? (result.fieldErrors ?? {}) : {};
    function onSubmit(e) {
        e.preventDefault();
        if (pending)
            return; // block double submits
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            let res;
            try {
                res = await submitEnquiry(fd);
            }
            catch {
                res = { ok: false, error: "Network problem - your details are still in the form. Please try again." };
            }
            setResult(res);
            if (res.ok) {
                toast.success(`Enquiry ${res.reference} saved`);
                window.open(res.whatsappUrl, "_blank", "noopener,noreferrer");
            }
            else {
                toast.error(res.error);
            }
        });
    }
    if (result?.ok) {
        return (<div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden/>
        <h3 className="mt-3 text-xl font-bold">Enquiry saved - reference {result.reference}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap below to send it to us on WhatsApp. We confirm price, timeline and delivery directly with you - no payment is taken on this website.
        </p>
        <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 font-semibold text-white">
          <MessageCircle className="size-5" aria-hidden/> Continue on WhatsApp
        </a>
        <div>
          <button type="button" className="mt-4 text-sm font-medium text-muted-foreground underline" onClick={() => {
                setResult(null);
                formRef.current?.reset();
            }}>
            Submit another enquiry
          </button>
        </div>
      </div>);
    }
    return (<form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="type" value={type}/>
      {productId ? <input type="hidden" name="product_id" value={productId}/> : null}
      {/* honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off"/>
      </div>

      {result && !result.ok ? (<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-danger">
          {result.error}
        </p>) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="customer_name" error={errors.customer_name}>
          <Input id="customer_name" name="customer_name" autoComplete="name" required aria-invalid={!!errors.customer_name}/>
        </Field>
        <Field label="WhatsApp / phone" htmlFor="phone" error={errors.phone} hint="Include country code for non-Indian numbers">
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required aria-invalid={!!errors.phone}/>
        </Field>
      </div>

      {type !== "product" ? (<Field label="Email (optional)" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email}/>
        </Field>) : null}

      {type === "bulk_order" ? (<div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company / organisation" htmlFor="company_name" error={errors.company_name}>
            <Input id="company_name" name="company_name" required aria-invalid={!!errors.company_name}/>
          </Field>
          <Field label="Product or gift type" htmlFor="product_name" error={errors.product_name}>
            <Input id="product_name" name="product_name" placeholder="e.g. Custom keychains" required aria-invalid={!!errors.product_name}/>
          </Field>
        </div>) : null}

      {type === "custom_print" || type === "bulk_order" || type === "product" ? (<div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantity" htmlFor="quantity" error={errors.quantity} hint={type === "bulk_order" ? "Minimum 10 pieces" : undefined}>
            <Input id="quantity" name="quantity" type="number" min={type === "bulk_order" ? 10 : 1} inputMode="numeric" defaultValue={type === "bulk_order" ? 50 : 1} required={type !== "product"} aria-invalid={!!errors.quantity}/>
          </Field>
          {type !== "product" ? (<Field label="Required by (optional)" htmlFor="required_by" error={errors.required_by}>
              <Input id="required_by" name="required_by" type="date" aria-invalid={!!errors.required_by}/>
            </Field>) : null}
        </div>) : null}

      {type === "custom_print" ? (<div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred material" htmlFor="material">
            <Select id="material" name="material" defaultValue="">
              <option value="">No preference</option>
              {MATERIALS.map((m) => (<option key={m}>{m}</option>))}
            </Select>
          </Field>
          <Field label="Approximate size" htmlFor="size_preference">
            <Input id="size_preference" name="size_preference" placeholder="e.g. 10 x 6 x 4 cm"/>
          </Field>
        </div>) : null}

      {type === "custom_print" || type === "bulk_order" ? (<Field label={type === "custom_print" ? "Project description" : "Customisation / branding details (optional)"} htmlFor="customization_details" error={errors.customization_details}>
          <Textarea id="customization_details" name="customization_details" required={type === "custom_print"} aria-invalid={!!errors.customization_details}/>
        </Field>) : (<Field label={type === "contact" ? "Message" : "Message (optional)"} htmlFor="message" error={errors.message}>
          <Textarea id="message" name="message" required={type === "contact"} aria-invalid={!!errors.message}/>
        </Field>)}

      {type === "custom_print" ? (<div className="space-y-1.5">
          <label htmlFor="files" className="text-sm font-medium">
            Reference files (optional)
          </label>
          <label htmlFor="files" className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-muted/50 px-4 text-sm text-muted-foreground hover:border-gold-deep">
            <Paperclip className="size-4" aria-hidden/>
            {fileNote || "STL, STEP, 3MF, images, PDF or ZIP - up to 3 files, "+__MAX_UPLOAD_MB__+" MB total"}
          </label>
          <input id="files" name="files" type="file" multiple accept=".stl,.step,.stp,.3mf,.png,.jpg,.jpeg,.webp,.pdf,.zip" className="sr-only" onChange={async (e) => {
            // Shrink photos in the browser, then check the total against the host's request-size limit.
            const input = e.currentTarget;
            const chosen = [...(input.files ?? [])];
            if (!chosen.length)
                return setFileNote("");
            const dt = new DataTransfer();
            for (const f of chosen)
                dt.items.add(await compressImage(f));
            input.files = dt.files;
            const total = [...dt.files].reduce((n, f) => n + f.size, 0);
            if (total > __MAX_UPLOAD_MB__ * 1024 * 1024) {
                input.value = "";
                setFileNote(`Those files are too large (limit ${__MAX_UPLOAD_MB__} MB total). Send big files to us on WhatsApp instead.`);
                return;
            }
            setFileNote(`${chosen.length} file(s) selected`);
        }}/>
        </div>) : null}

      <Button type="submit" variant="whatsapp" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden/> : <MessageCircle className="size-4.5" aria-hidden/>}
        {pending ? "Saving..." : (submitLabel ?? "Save enquiry & continue on WhatsApp")}
      </Button>
      <p className="text-xs text-muted-foreground">
        We save your enquiry, then open WhatsApp with a pre-filled message. No payment is collected on this website.
      </p>
    </form>);
}
