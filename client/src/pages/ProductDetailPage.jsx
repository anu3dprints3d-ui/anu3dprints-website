import { useParams } from "react-router-dom";
import { ChevronRight, Clock, Ruler, Weight } from "lucide-react";
import Link from "@/components/Link";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductCard } from "@/components/products/product-card";
import { ShareButton } from "@/components/products/share-button";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { WhatsAppLink } from "@/components/whatsapp/whatsapp-link";
import { Badge, Skeleton } from "@/components/ui/misc";
import { getProductBySlug, getRelatedProducts, sortImages } from "@/lib/data/catalogue";
import { useSettings } from "@/lib/settings";
import { useSeo } from "@/lib/seo";
import { useData } from "@/lib/useData";
import { publicImageUrl, SITE_URL } from "@/lib/urls";
import { formatINR } from "@shared/format";
import { productEnquiryMessage } from "@shared/whatsapp";
import { AVAILABILITY_LABELS } from "@shared/constants";
import NotFound from "./NotFound";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const settings = useSettings();
  const { data, loading } = useData(async () => {
    const product = await getProductBySlug(slug);
    return product ? { product, related: await getRelatedProducts(product) } : null;
  }, [slug]);

  const product = data?.product;
  useSeo({
    title: product ? product.seo_title || product.name : undefined,
    description: product ? product.seo_description || product.short_description : undefined,
    image: product ? publicImageUrl(sortImages(product.product_images)[0]?.storage_key) : undefined,
    path: `/products/${slug}`,
  });

  if (loading) return <div className="container-page py-10"><Skeleton className="aspect-square max-w-xl" /></div>;
  if (!product) return <NotFound inline />;

  const images = sortImages(product.product_images).map((i) => ({ src: publicImageUrl(i.storage_key), alt: i.alt_text ?? product.name }));
  const url = `${SITE_URL}/products/${product.slug}`;
  const onSale = product.sale_price != null && product.sale_price < product.price;
  const price = onSale ? product.sale_price : product.price;
  const specs = [
    ...(product.specifications ?? []),
    ...(product.material_options.length ? [{ label: "Materials", value: product.material_options.join(", ") }] : []),
    ...(product.size_options.length ? [{ label: "Sizes", value: product.size_options.join(", ") }] : []),
    ...(product.color_options.length ? [{ label: "Colours", value: product.color_options.join(", ") }] : []),
  ];

  return (
    <div className="container-page py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/products" className="py-2 hover:text-ink">Products</Link>
        {product.categories ? (
          <>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href={`/categories/${product.categories.slug}`} className="py-2 hover:text-ink">{product.categories.name}</Link>
          </>
        ) : null}
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="py-2 text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={images} name={product.name} product={product} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={product.availability === "out_of_stock" ? "red" : "green"}>{AVAILABILITY_LABELS[product.availability]}</Badge>
            {product.is_popular ? <Badge tone="gold">Popular</Badge> : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{product.name}</h1>
          {product.sku ? <p className="mt-1 text-sm text-muted-foreground">SKU: {product.sku}</p> : null}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{formatINR(price)}</span>
            {onSale ? <span className="text-lg text-muted-foreground line-through">{formatINR(product.price)}</span> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Price shown is indicative. Final price and timeline are confirmed on WhatsApp.</p>

          {product.short_description ? <p className="mt-5 text-lg text-muted-foreground">{product.short_description}</p> : null}

          <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
            {product.print_duration ? <li className="flex items-center gap-2"><Clock className="size-4 text-gold-deep" aria-hidden /> Print time: {product.print_duration}</li> : null}
            {product.lead_time || settings.shipping.lead_time_message ? <li className="flex items-center gap-2"><Clock className="size-4 text-gold-deep" aria-hidden /> Lead time: {product.lead_time || settings.shipping.lead_time_message}</li> : null}
            {product.dimensions ? <li className="flex items-center gap-2"><Ruler className="size-4 text-gold-deep" aria-hidden /> {product.dimensions}</li> : null}
            {product.weight_grams ? <li className="flex items-center gap-2"><Weight className="size-4 text-gold-deep" aria-hidden /> {product.weight_grams} g</li> : null}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <WhatsAppLink phone={settings.business.whatsapp} message={productEnquiryMessage({ name: product.name, sku: product.sku, price, url })} size="lg" className="flex-1" source="product-detail" />
            <ShareButton title={product.name} url={url} />
          </div>

          <details className="mt-4 rounded-2xl border border-border bg-card px-4">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold">Prefer us to call you back? Send an enquiry form</summary>
            <div className="pb-4"><EnquiryForm type="product" productId={product.id} submitLabel="Send enquiry" /></div>
          </details>

          {specs.length ? (
            <dl className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
              {specs.map((s) => (
                <div key={s.label} className="grid grid-cols-3 gap-3 px-4 py-3 text-sm">
                  <dt className="font-medium">{s.label}</dt>
                  <dd className="col-span-2 text-muted-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>

      {product.description ? (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold">About this product</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
        </section>
      ) : null}

      {data.related.length ? (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {data.related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
