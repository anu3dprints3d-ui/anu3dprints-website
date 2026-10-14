import { Fragment } from "react";
import { ArrowRight, Box, Building2, Calculator, Cog, Factory, Gem, Gift, KeyRound, Lamp, MapPin, MessageCircle, Palette, PenLine, Plus, Printer, Shapes, Smartphone, ToyBrick, Truck, UploadCloud, Zap, IndianRupee } from "lucide-react";
import Image from "@/components/Image";
import Link from "@/components/Link";
import { CreationsStrip } from "@/components/layout/creations-strip";
import { Marquee } from "@/components/layout/marquee";
import { ProductCard } from "@/components/products/product-card";
import { WhatsAppLink } from "@/components/whatsapp/whatsapp-link";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { getCategories, getFaqs, getGallery, getHomepageSections, getProducts } from "@/lib/data/catalogue";
import { useSettings } from "@/lib/settings";
import { useSeo } from "@/lib/seo";
import { useData } from "@/lib/useData";
import { publicImageUrl } from "@/lib/urls";
import { generalMessage } from "@shared/whatsapp";

const CHIPS = [
  { icon: Gem, label: "High Quality", sub: "Prints" },
  { icon: Zap, label: "Fast", sub: "Turnaround" },
  { icon: IndianRupee, label: "Affordable", sub: "Pricing" },
  { icon: MapPin, label: "Coimbatore", sub: "Based" },
];

const DEFAULT_STEPS = [
  { title: "Share Your File", body: "Upload STL/STEP or share your idea with us." },
  { title: "Get a Quote", body: "We'll confirm the price, material & timeline." },
  { title: "We Print", body: "High quality printing with care and checks." },
  { title: "Delivery / Pickup", body: "Get your product delivered or collect in Coimbatore." },
];

const TICKER = ["From Digital Design to Reality", "Custom 3D Printing", "Personalised Gifts", "Engineering Prototypes", "Bulk & Corporate Orders", "Delivery Across India"];

const STEP_ICONS = [UploadCloud, Calculator, Printer, Truck];

const BUSINESS = [
  { icon: Gift, label: "Return Gifts & Event Rewards" },
  { icon: Building2, label: "Corporate Gifts" },
  { icon: Cog, label: "Die Makers & Tooling Support" },
  { icon: Factory, label: "Industrial Prototypes" },
];

/** Picks a fitting icon for a category from its name when it has no image. */
function categoryIcon(name) {
  const n = name.toLowerCase();
  if (n.includes("gift")) return Gift;
  if (n.includes("key")) return KeyRound;
  if (n.includes("lamp")) return Lamp;
  if (n.includes("phone")) return Smartphone;
  if (n.includes("toy") || n.includes("figur")) return ToyBrick;
  if (n.includes("engineer") || n.includes("proto")) return Cog;
  if (n.includes("corporate")) return Building2;
  if (n.includes("pen") || n.includes("desk")) return PenLine;
  if (n.includes("custom")) return Printer;
  if (n.includes("colour") || n.includes("color")) return Palette;
  if (n.includes("tissue") || n.includes("organi")) return Box;
  return Shapes;
}

function SectionTitle({ title, subtitle, href, cta = "View all" }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          <span className="h-1 w-5 rounded-full bg-gold" aria-hidden />
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="-my-2 flex shrink-0 items-center gap-1 py-2.5 text-xs font-semibold hover:text-gold-deep">
          {cta} <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

function ProductRow({ products }) {
  return (
    <div className="grid grid-cols-2 gap-3 max-sm:[&>a:nth-child(n+5)]:hidden sm:grid-cols-3 lg:grid-cols-6">
      {products.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

function CustomPrintCard({ phone }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/25 to-gold/10 p-5 shadow-card">
      <div>
        <Box className="size-8 text-ink" aria-hidden />
        <h3 className="mt-3 text-lg font-bold">Need a Custom Print?</h3>
        <p className="mt-1 text-[13px] text-ink/70">Upload your 3D file or share your idea. We&apos;ll help with design, material and pricing.</p>
      </div>
      <div className="mt-4 space-y-2">
        <ButtonLink href="/custom-3d-printing" variant="primary" className="w-full">Get a Quote <ArrowRight className="size-4" aria-hidden /></ButtonLink>
        <WhatsAppLink phone={phone} message={generalMessage()} variant="outline" className="w-full border-whatsapp text-whatsapp hover:bg-white" source="home-custom">Chat on WhatsApp</WhatsAppLink>
      </div>
    </div>
  );
}

export default function HomePage() {
  const settings = useSettings();
  const b = settings.business;
  useSeo({ title: settings.seo.title, description: settings.seo.description, path: "/" });

  const { data, loading } = useData(async () => {
    const [sections, categories, featured, popular, recent, gallery, faqs] = await Promise.all([
      getHomepageSections(),
      getCategories(),
      getProducts({ featured: true }).then((r) => r.products),
      getProducts({ popular: true }).then((r) => r.products),
      getProducts({ sort: "newest" }).then((r) => r.products),
      getGallery(6),
      getFaqs(),
    ]);
    // Each product appears once on the page: Featured first, then Popular, then Recent.
    const seen = new Set();
    // A row needs at least 3 not-yet-shown products, otherwise it is skipped (no sparse rows).
    const fresh = (list, min = 3) => {
      const rest = list.filter((p) => !seen.has(p.id)).slice(0, 6);
      if (rest.length < min) return [];
      rest.forEach((p) => seen.add(p.id));
      return rest;
    };
    const featuredRow = fresh(featured);
    const popularRow = fresh(popular);
    const recentRow = fresh(recent);
    return { sections, categories: categories.filter((c) => c.is_active), featured: featuredRow, popular: popularRow, recent: recentRow, showcase: recent.slice(0, 12), gallery, faqs };
  }, []);

  if (loading || !data) {
    return (
      <>
        <div className="h-[22rem] bg-ink" />
        <div className="container-page space-y-4 py-10"><Skeleton className="h-24" /><Skeleton className="h-56" /></div>
      </>
    );
  }

  const { sections, categories, featured, popular, recent, showcase, gallery, faqs } = data;
  const sec = (key) => sections.find((s) => s.key === key);
  const visible = (key) => sec(key)?.is_visible !== false;
  const hero = sec("hero");
  const heroContent = hero?.content ?? {};
  const heroImage = publicImageUrl(heroContent.image_key);

  const title = hero?.title || b.tagline;
  const words = title.split(" ");
  const last = words.pop();

  const blocks = {
    hero: (
      <Fragment key="hero">
      <section className="relative isolate overflow-hidden bg-ink text-white">
        {/* Full-bleed photo background (admin-uploaded hero image wins over the bundled default). */}
        {heroImage ? (
          <Image src={heroImage} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[55%_center] lg:object-[30%_center]" />
        ) : (
          <img
            src="/images/hero-2400.webp"
            srcSet="/images/hero-1600.webp 1600w, /images/hero-2400.webp 2400w, /images/hero-3200.webp 3200w"
            sizes="100vw"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[55%_center] lg:object-[28%_center]"
          />
        )}
        {/* Readability scrim: darkens the text side only, so the products stay vivid. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/90 via-ink/55 to-ink/25 lg:bg-gradient-to-r lg:from-ink/95 lg:from-0% lg:via-ink/55 lg:via-35% lg:to-transparent lg:to-62%" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-16 bg-gradient-to-t from-ink/60 to-transparent" />

        <div className="container-page relative py-10 sm:py-12 lg:min-h-[19rem] lg:py-12">
          <div className="reveal max-w-md">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/75">Welcome to {b.name}</p>
            <h1 className="mt-2 text-balance text-3xl font-extrabold leading-[1.08] sm:text-4xl lg:text-[2.6rem]">
              {words.join(" ")} <span className="text-gold">{last}</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm text-white/85 sm:text-[15px]">{hero?.subtitle || "Custom 3D Printing | Personalised Gifts | Engineering Prototypes"}</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
              {CHIPS.map(({ icon: Icon, label, sub }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="size-6 text-gold" strokeWidth={1.5} aria-hidden />
                  <span className="text-[11px] font-medium leading-tight text-white/90">{label}<br />{sub}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/products" size="md">{heroContent.primary_cta || "Explore Products"} <ArrowRight className="size-4" aria-hidden /></ButtonLink>
              <ButtonLink href="/custom-3d-printing" variant="ghost" className="border border-white/50 bg-ink/30 text-white backdrop-blur-sm hover:bg-white/15">{heroContent.secondary_cta || "Get a Custom Quote"}</ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <Marquee headline={b.support || "Small Ideas. Big Creations!"} items={TICKER} />
      </Fragment>
    ),

    trust: null,

    categories: categories.length > 0 && (
      <section key="categories" className="border-b border-border bg-muted/60">
        <ul className="container-page grid grid-cols-3 gap-2.5 py-5 sm:grid-cols-4 lg:grid-cols-7">
          {categories.slice(0, 6).map((c) => {
            const src = publicImageUrl(c.image_key);
            const Icon = categoryIcon(c.name);
            return (
              <li key={c.id}>
                <Link href={`/categories/${c.slug}`} className="group flex h-full flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-card">
                  <span className="relative grid size-12 place-items-center overflow-hidden rounded-lg bg-gold/15 text-gold-deep transition-colors group-hover:bg-gold group-hover:text-ink">
                    {src ? <Image src={src} alt="" fill sizes="48px" className="object-cover" /> : <Icon className="size-6" strokeWidth={1.6} aria-hidden />}
                  </span>
                  <span className="line-clamp-2 text-xs font-semibold leading-tight">{c.name}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/products" className="flex h-full min-h-[6.25rem] flex-col items-center justify-center gap-1.5 rounded-xl bg-ink p-3 text-center text-white transition-colors hover:bg-black">
              <Plus className="size-6 text-gold" aria-hidden />
              <span className="text-xs font-semibold leading-tight">View All Products</span>
            </Link>
          </li>
        </ul>
      </section>
    ),

    featured: featured.length > 0 && (
      <section key="featured" className="container-page pt-10">
        <SectionTitle title={sec("featured")?.title ?? "Featured Products"} subtitle="Popular 3D printed products loved by our customers" href="/products?show=featured" cta="View All Products" />
        <ProductRow products={featured} />
      </section>
    ),

    popular: popular.length > 0 && (
      <section key="popular" className="container-page pt-10">
        <SectionTitle title={sec("popular")?.title ?? "Popular Picks"} href="/products?show=popular" />
        <ProductRow products={popular} />
      </section>
    ),

    recent: recent.length > 0 && (
      <section key="recent" className="container-page pt-10">
        <SectionTitle title={sec("recent")?.title ?? "Recently Added"} href="/products" />
        <ProductRow products={recent} />
      </section>
    ),

    how_it_works: (
      <section key="how" className="container-page pt-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
          <div>
            <SectionTitle title={sec("how_it_works")?.title ?? "How It Works"} subtitle="Get your custom 3D print in 4 simple steps" />
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(sec("how_it_works")?.content?.steps?.length ? sec("how_it_works").content.steps : DEFAULT_STEPS).slice(0, 4).map((s, i) => {
                const Icon = STEP_ICONS[i % STEP_ICONS.length];
                return (
                  <li key={s.title} className="relative rounded-xl border border-border bg-card p-4 shadow-sm">
                    <span className="absolute -top-2.5 left-4 grid size-6 place-items-center rounded-full bg-gold text-xs font-extrabold">{i + 1}</span>
                    <Icon className="mt-1 size-8 text-ink" strokeWidth={1.4} aria-hidden />
                    <h3 className="mt-2 text-sm font-bold">{s.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>
          <CustomPrintCard phone={b.whatsapp} />
        </div>
      </section>
    ),

    creations: <CreationsStrip key="creations" products={showcase} />,

    // Merged into the "How it works" card; only shown on its own if that section is hidden.
    custom_print: !visible("how_it_works") && sec("custom_print") && (
      <section key="custom" className="container-page pt-12"><CustomPrintCard phone={b.whatsapp} /></section>
    ),

    bulk: (
      <section key="bulk" className="relative isolate mt-12 overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_120%_at_0%_50%,rgba(245,183,0,0.14),transparent)]" />
        <Cog className="absolute -left-10 top-1/2 -z-10 size-56 -translate-y-1/2 text-white/5" strokeWidth={1} aria-hidden />
        <div className="container-page grid items-center gap-6 py-8 lg:grid-cols-[1.1fr_1.5fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Bulk Orders &amp; Industrial Services</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">{sec("bulk")?.title ?? "For Businesses, Events & Industries"}</h2>
            <p className="mt-2 max-w-md text-sm text-white/70">{sec("bulk")?.subtitle || "We work with event management companies, corporate clients, die makers and industries for bulk orders and custom printing solutions."}</p>
            <ButtonLink href="/bulk-orders" variant="ghost" size="sm" className="mt-4 border border-white/40 text-white hover:bg-white/10">Enquire Now <ArrowRight className="size-3.5" aria-hidden /></ButtonLink>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BUSINESS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center transition-colors hover:border-gold/60">
                <Icon className="size-7 text-gold" strokeWidth={1.4} aria-hidden />
                <span className="text-[11px] font-medium leading-tight text-white/85">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    ),

    gallery: gallery.length > 0 && (
      <section key="gallery" className="container-page pt-12">
        <SectionTitle title={sec("gallery")?.title ?? "Project Showcase"} href="/gallery" cta="Full gallery" />
        <ul className="grid grid-cols-3 gap-2.5 lg:grid-cols-6">
          {gallery.map((g) => (
            <li key={g.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              <Image src={publicImageUrl(g.storage_key)} alt={g.alt_text} fill sizes="(min-width:1024px) 16vw, 33vw" className="object-cover transition-transform duration-500 hover:scale-105" />
            </li>
          ))}
        </ul>
      </section>
    ),

    faq: faqs.length > 0 && (
      <section key="faq" className="container-page max-w-3xl pt-12">
        <SectionTitle title={sec("faq")?.title ?? "FAQ"} href="/faq" cta="More questions" />
        <div className="space-y-2">
          {faqs.slice(0, 4).map((f) => (
            <details key={f.id} className="rounded-xl border border-border bg-card px-4 text-sm">
              <summary className="min-h-11 cursor-pointer py-3 font-semibold">{f.question}</summary>
              <p className="pb-3 text-muted-foreground">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
    ),

    contact: (
      <section key="contact" className="container-page pt-12">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-whatsapp/10 px-6 py-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="flex items-center justify-center gap-2 text-lg font-bold sm:justify-start"><MessageCircle className="size-5 text-whatsapp" aria-hidden />{sec("contact")?.title ?? "Talk to Us on WhatsApp"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Share an idea, photo or file. We reply with options, price and timeline - no payment on this website.</p>
          </div>
          <WhatsAppLink phone={b.whatsapp} message={generalMessage()} source="home-contact">Chat on WhatsApp</WhatsAppLink>
        </div>
      </section>
    ),
  };

  // Section order and visibility are admin-controlled.
  const order = sections.filter((s) => s.is_visible).map((s) => s.key);
  const keys = [...(order.length ? order : Object.keys(blocks))].filter((k) => k !== "creations");
  // The showcase is not a DB-managed section: it follows the product rows (or the categories strip).
  const anchor = Math.max(keys.indexOf("recent"), keys.indexOf("popular"), keys.indexOf("featured"), keys.indexOf("categories"));
  keys.splice(anchor + 1, 0, "creations");
  return <>{keys.map((k) => blocks[k]).filter(Boolean)}</>;
}
