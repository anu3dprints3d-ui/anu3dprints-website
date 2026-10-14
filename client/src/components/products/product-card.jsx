import Image from "@/components/Image";
import Link from "@/components/Link";
import { ProductArt } from "./product-art";
import { Badge } from "@/components/ui/misc";
import { formatINR } from "@shared/format";
import { publicImageUrl } from "@/lib/urls";
import { sortImages } from "@/lib/data/catalogue";
import { AVAILABILITY_LABELS } from "@shared/constants";

export function ProductCard({ product, priority }) {
  const image = sortImages(product.product_images)[0];
  const src = publicImageUrl(image?.storage_key);
  const onSale = product.sale_price != null && product.sale_price < product.price;
  const meta = [product.material_options?.[0], product.print_duration, product.dimensions].filter(Boolean).join(" | ");
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-lift"
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-muted">
        {src ? (
          <Image src={src} alt={image?.alt_text || product.name} fill sizes="(min-width:1024px) 16vw, (min-width:640px) 30vw, 46vw" priority={priority} className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <ProductArt product={product} className="size-full transition-transform duration-500 group-hover:scale-105" />
        )}
        <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
          {product.is_featured ? <Badge tone="dark" className="px-2 py-0 text-[10px]">Featured</Badge> : null}
          {onSale ? <Badge tone="gold" className="px-2 py-0 text-[10px]">Sale</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug">{product.name}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-bold">{formatINR(onSale ? product.sale_price : product.price)}</span>
          {onSale ? <span className="text-xs text-muted-foreground line-through">{formatINR(product.price)}</span> : null}
        </div>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">
          {meta || (product.availability === "made_to_order" && product.lead_time ? `Made to order - ${product.lead_time}` : AVAILABILITY_LABELS[product.availability])}
        </p>
        <span className="mt-2 grid min-h-8 place-items-center rounded-md bg-ink text-xs font-semibold text-white transition-colors group-hover:bg-gold group-hover:text-ink">View Details</span>
      </div>
    </Link>
  );
}
