import Image from "@/components/Image";
import { useState } from "react";
import { ProductArt } from "./product-art";
import { cn } from "@/lib/utils";
export function ProductGallery({ images, name, product }) {
    const [active, setActive] = useState(0);
    if (images.length === 0) {
        return (<div className="relative aspect-square overflow-hidden rounded-2xl border border-border">
        <ProductArt product={product ?? { name }} className="size-full" />
        <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] text-white">Illustration - photo coming soon</span>
      </div>);
    }
    const current = images[active] ?? images[0];
    return (<div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        <Image key={current.src} src={current.src} alt={current.alt || name} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover"/>
      </div>
      {images.length > 1 ? (<ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Product images">
          {images.map((img, i) => (<li key={img.src} className="shrink-0">
              <button type="button" onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-current={i === active} className={cn("relative block size-16 overflow-hidden rounded-xl border-2 sm:size-20", i === active ? "border-gold-deep" : "border-transparent opacity-70 hover:opacity-100")}>
                <Image src={img.src} alt="" fill sizes="80px" className="object-cover"/>
              </button>
            </li>))}
        </ul>) : null}
    </div>);
}
