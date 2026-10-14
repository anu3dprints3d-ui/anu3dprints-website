import Image from "@/components/Image";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { deleteProductImage, moveProductImage, setPrimaryImage, updateImageAlt, uploadProductImage } from "@/api";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@shared/imageValidation";
import { cn } from "@/lib/utils";
import { useRouter } from "@/lib/nav";
export function ImageManager({ productId, images }) {
    const router = useRouter();
    const inputRef = useRef(null);
    const [drag, setDrag] = useState(false);
    const [progress, setProgress] = useState(null);
    const [pending, start] = useTransition();
    async function uploadFiles(files) {
        const accepted = files.filter((f) => {
            if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
                toast.error(`${f.name}: only JPEG, PNG or WebP`);
                return false;
            }
            if (f.size > MAX_IMAGE_BYTES) {
                toast.error(`${f.name}: larger than 5 MB`);
                return false;
            }
            return true;
        });
        if (!accepted.length)
            return;
        const failed = [];
        setProgress({ done: 0, total: accepted.length, failed });
        for (const [i, file] of accepted.entries()) {
            const fd = new FormData();
            fd.set("file", file);
            let res;
            try {
                res = await uploadProductImage(productId, fd);
            }
            catch {
                res = { ok: false, message: "Network error" };
            }
            if (!res.ok) {
                failed.push(file.name);
                toast.error(`${file.name}: ${res.message}`);
            }
            setProgress({ done: i + 1, total: accepted.length, failed: [...failed] });
        }
        if (accepted.length > failed.length)
            toast.success(`${accepted.length - failed.length} image(s) uploaded successfully.`);
        router.refresh();
    }
    function act(fn) {
        start(async () => {
            const res = await fn();
            if (res.ok)
                router.refresh();
            else
                toast.error(res.message ?? "Failed");
        });
    }
    return (<div className="space-y-4">
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void uploadFiles([...e.dataTransfer.files]); }} className={cn("flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors", drag ? "border-gold-deep bg-gold/10" : "border-border bg-muted/40")}>
        <UploadCloud className="size-8 text-gold-deep" aria-hidden/>
        <p className="text-sm font-medium">Drag &amp; drop images here, or</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white">Choose files</button>
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload product images" onChange={(e) => { void uploadFiles([...(e.target.files ?? [])]); e.target.value = ""; }}/>
        <p className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 5 MB each. Images are resized and converted to WebP.</p>
        {progress && progress.done < progress.total ? (<p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" aria-hidden/> Uploading {progress.done + 1} of {progress.total}...</p>) : null}
        {progress && progress.failed.length > 0 && progress.done === progress.total ? (<p role="alert" className="text-sm text-danger">Failed: {progress.failed.join(", ")}. Choose them again to retry.</p>) : null}
      </div>

      {images.length === 0 ? <p className="text-sm text-muted-foreground">No images yet. The first image you upload becomes the primary image.</p> : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (<li key={img.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-square bg-muted">
              <Image src={img.url} alt={img.alt || "Product image"} fill sizes="200px" className="object-cover"/>
              {img.isPrimary ? <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-xs font-bold">Primary</span> : null}
            </div>
            <div className="space-y-2 p-2">
              <input defaultValue={img.alt} aria-label="Alt text" placeholder="Alt text" maxLength={200} onBlur={(e) => { if (e.target.value !== img.alt)
            act(() => updateImageAlt(img.id, e.target.value)); }} className="min-h-9 w-full rounded-lg border border-border px-2 text-xs"/>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button type="button" disabled={pending || i === 0} aria-label="Move earlier" onClick={() => act(() => moveProductImage(productId, img.id, -1))} className="grid size-9 place-items-center rounded-lg hover:bg-muted disabled:opacity-30"><ArrowLeft className="size-4"/></button>
                  <button type="button" disabled={pending || i === images.length - 1} aria-label="Move later" onClick={() => act(() => moveProductImage(productId, img.id, 1))} className="grid size-9 place-items-center rounded-lg hover:bg-muted disabled:opacity-30"><ArrowRight className="size-4"/></button>
                  <button type="button" disabled={pending || img.isPrimary} aria-label="Make primary" onClick={() => act(() => setPrimaryImage(productId, img.id))} className="grid size-9 place-items-center rounded-lg hover:bg-muted disabled:opacity-30"><Star className="size-4"/></button>
                </div>
                <button type="button" disabled={pending} aria-label="Delete image" onClick={() => { if (confirm("Delete this image permanently?"))
            act(() => deleteProductImage(img.id)); }} className="grid size-9 place-items-center rounded-lg text-danger hover:bg-red-50"><Trash2 className="size-4"/></button>
              </div>
            </div>
          </li>))}
      </ul>
    </div>);
}
