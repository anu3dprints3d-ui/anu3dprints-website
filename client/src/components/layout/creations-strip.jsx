import Image from "@/components/Image";
import Link from "@/components/Link";
import { ProductArt } from "@/components/products/product-art";
import { sortImages } from "@/lib/data/catalogue";
import { publicImageUrl } from "@/lib/urls";
import { formatINR } from "@shared/format";

function Card({ product }) {
  const image = sortImages(product.product_images)[0];
  const src = publicImageUrl(image?.storage_key);
  return (
    <li className="w-40 shrink-0 sm:w-44">
      <Link href={`/products/${product.slug}`} className="group relative block aspect-square overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-lift">
        {src ? (
          <Image src={src} alt={image?.alt_text || product.name} fill sizes="176px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <ProductArt product={product} className="size-full transition-transform duration-500 group-hover:scale-110" />
        )}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/60 to-transparent px-3 pb-2.5 pt-8 text-white">
          <span className="block truncate text-[13px] font-semibold">{product.name}</span>
          <span className="text-xs font-bold text-gold">{formatINR(product.sale_price ?? product.price)}</span>
        </span>
      </Link>
    </li>
  );
}

/** Auto-scrolling showcase of products. Pauses on hover; static (scrollable) for reduced-motion users. */
export function CreationsStrip({ products }) {
  if (products.length < 3) return null;
  // Repeat short lists so the track is always wider than the screen (needed for a seamless loop).
  const base = products.length >= 8 ? products : [...products, ...products];
  const duration = `${Math.max(30, base.length * 6)}s`;
  return (
    <section aria-label="More 3D creations" className="mt-12 overflow-hidden">
      <div className="container-page mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl"><span className="h-1 w-5 rounded-full bg-gold" aria-hidden />More 3D Creations</h2>
          <p className="mt-1 text-sm text-muted-foreground">A peek at what we have printed lately</p>
        </div>
        <Link href="/products" className="-my-2 shrink-0 py-2.5 text-xs font-semibold hover:text-gold-deep">See everything &rarr;</Link>
      </div>
      <div className="[mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <div className="marquee flex gap-4 py-2 pl-4" style={{ animationDuration: duration }}>
          {[0, 1].map((n) => (
            <ul key={n} className="flex shrink-0 gap-4" aria-hidden={n === 1 ? "true" : undefined}>
              {base.map((p, i) => <Card key={`${p.id}-${i}`} product={p} />)}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
