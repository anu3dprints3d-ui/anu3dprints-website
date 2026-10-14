import Image from "@/components/Image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
export function GalleryGrid({ items }) {
    const types = useMemo(() => [...new Set(items.map((i) => i.type).filter(Boolean))], [items]);
    const [filter, setFilter] = useState(null);
    const [open, setOpen] = useState(null);
    const { business } = useSettings();
    const [pdf, setPdf] = useState(null); // null | { done, total }
    async function exportPdf() {
        if (pdf || shown.length === 0)
            return;
        setPdf({ done: 0, total: shown.length });
        try {
            // Loaded on demand so the PDF library never affects normal page loads.
            const { exportGalleryPdf } = await import("@/lib/galleryPdf");
            const res = await exportGalleryPdf({
                items: shown,
                businessName: business.name,
                tagline: business.tagline,
                siteUrl: window.location.origin,
                filterLabel: filter,
                onProgress: (done, total) => setPdf({ done, total }),
            });
            toast.success(`PDF downloaded (${res.pages} page${res.pages === 1 ? "" : "s"})`);
            if (res.skipped)
                toast.warning(`${res.skipped} image(s) could not be loaded and were left blank.`);
            if (res.truncated)
                toast.info("Only the first 60 images were included. Use a category filter to export the rest.");
        }
        catch {
            toast.error("Could not create the PDF. Please check your connection and try again.");
        }
        finally {
            setPdf(null);
        }
    }
    const shown = filter ? items.filter((i) => i.type === filter) : items;
    const step = useCallback((d) => setOpen((i) => (i == null ? i : (i + d + shown.length) % shown.length)), [shown.length]);
    useEffect(() => {
        if (open == null)
            return;
        const onKey = (e) => {
            if (e.key === "Escape")
                setOpen(null);
            if (e.key === "ArrowRight")
                step(1);
            if (e.key === "ArrowLeft")
                step(-1);
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, step]);
    const current = open != null ? shown[open] : null;
    return (<>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by project type">
          {types.length > 0 ? [null, ...types].map((t) => (<button key={t ?? "all"} type="button" onClick={() => setFilter(t)} aria-pressed={filter === t} className={cn("min-h-10 rounded-full border px-4 text-sm font-medium", filter === t ? "border-ink bg-ink text-white" : "border-border bg-card hover:border-ink")}>
              {t ?? "All"}
            </button>)) : null}
        </div>
        <Button variant="dark" size="sm" onClick={exportPdf} disabled={!!pdf || shown.length === 0} aria-busy={!!pdf}>
          {pdf ? <Loader2 className="size-4 animate-spin" aria-hidden/> : <Download className="size-4" aria-hidden/>}
          {pdf ? `Preparing PDF ${Math.min(pdf.done, pdf.total)}/${pdf.total}...` : "Export PDF"}
        </Button>
      </div>

      <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
        {shown.map((g, i) => (<li key={g.id} className="break-inside-avoid">
            <button type="button" onClick={() => setOpen(i)} className="group relative block w-full overflow-hidden rounded-2xl bg-muted" aria-label={`View ${g.alt}`}>
              <Image src={g.src} alt={g.alt} width={600} height={600} sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" className="h-auto w-full transition-transform duration-500 group-hover:scale-105" loading="lazy"/>
            </button>
          </li>))}
      </ul>

      {current ? (<div role="dialog" aria-modal="true" aria-label="Image viewer" className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <button type="button" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/10 text-white" aria-label="Close" onClick={() => setOpen(null)}>
            <X className="size-5"/>
          </button>
          {shown.length > 1 ? (<>
              <button type="button" className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white" aria-label="Previous" onClick={(e) => { e.stopPropagation(); step(-1); }}>
                <ChevronLeft className="size-6"/>
              </button>
              <button type="button" className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white" aria-label="Next" onClick={(e) => { e.stopPropagation(); step(1); }}>
                <ChevronRight className="size-6"/>
              </button>
            </>) : null}
          <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image src={current.src} alt={current.alt} width={1400} height={1400} className="max-h-[80dvh] w-auto rounded-xl object-contain"/>
            {current.caption ? <figcaption className="mt-3 text-center text-sm text-white/80">{current.caption}</figcaption> : null}
          </figure>
        </div>) : null}
    </>);
}
