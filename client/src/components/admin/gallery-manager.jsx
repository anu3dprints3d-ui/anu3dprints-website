import Image from "@/components/Image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/lib/nav";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { deleteGalleryItem, updateGalleryItem, uploadGalleryItem } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { Card } from "@/components/ui/misc";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@shared/imageValidation";
export function GalleryManager({ items }) {
    const router = useRouter();
    const inputRef = useRef(null);
    const [projectType, setProjectType] = useState("");
    const [progress, setProgress] = useState(null);
    const [pending, start] = useTransition();
    async function upload(files) {
        const ok = files.filter((f) => {
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
        if (!ok.length)
            return;
        let success = 0;
        for (const [i, file] of ok.entries()) {
            setProgress({ done: i, total: ok.length });
            const fd = new FormData();
            fd.set("file", file);
            fd.set("project_type", projectType);
            try {
                const res = await uploadGalleryItem(fd);
                if (res.ok)
                    success++;
                else
                    toast.error(`${file.name}: ${res.message}`);
            }
            catch {
                toast.error(`${file.name}: network error`);
            }
        }
        setProgress(null);
        if (success)
            toast.success(`${success} image(s) uploaded successfully.`);
        router.refresh();
    }
    return (<div className="space-y-6">
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1"><label htmlFor="pt" className="mb-1.5 block text-sm font-medium">Project type for new uploads</label><Input id="pt" value={projectType} onChange={(e) => setProjectType(e.target.value)} placeholder="e.g. Prototype, Gift, Decor" maxLength={60}/></div>
        <Button onClick={() => inputRef.current?.click()} disabled={!!progress}>{progress ? <Loader2 className="size-4 animate-spin" aria-hidden/> : <UploadCloud className="size-4" aria-hidden/>} {progress ? `Uploading ${progress.done + 1}/${progress.total}` : "Upload images"}</Button>
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload gallery images" onChange={(e) => { void upload([...(e.target.files ?? [])]); e.target.value = ""; }}/>
      </Card>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((g) => (<li key={g.id}>
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-muted"><Image src={g.url} alt={g.alt_text} fill sizes="(min-width:1280px) 33vw, 50vw" className="object-cover"/></div>
              <form className="space-y-2 p-3" action={(fd) => start(async () => {
                const res = await updateGalleryItem(g.id, fd);
                if (res.ok) {
                    toast.success(res.message);
                    router.refresh();
                }
                else
                    toast.error(res.message ?? "Failed");
            })}>
                <Input name="alt_text" defaultValue={g.alt_text} aria-label="Alt text" placeholder="Alt text (required)" required/>
                <Input name="caption" defaultValue={g.caption ?? ""} aria-label="Caption" placeholder="Caption"/>
                <div className="grid grid-cols-2 gap-2">
                  <Input name="project_type" defaultValue={g.project_type ?? ""} aria-label="Project type" placeholder="Type"/>
                  <Input name="sort_order" type="number" min={0} defaultValue={g.sort_order} aria-label="Display order"/>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="is_published" defaultChecked={g.is_published} className="size-4"/> Published</label>
                  <div className="flex gap-1">
                    <Button type="submit" size="sm" disabled={pending}>Save</Button>
                    <Button type="button" size="sm" variant="ghost" className="text-danger" aria-label="Delete image" disabled={pending} onClick={() => { if (confirm("Delete this image permanently?"))
            start(async () => { const r = await deleteGalleryItem(g.id); if (r.ok) {
                toast.success(r.message);
                router.refresh();
            }
            else
                toast.error(r.message ?? "Failed"); }); }}><Trash2 className="size-4"/></Button>
                  </div>
                </div>
              </form>
            </Card>
          </li>))}
      </ul>
    </div>);
}
