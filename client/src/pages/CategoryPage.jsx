import { useParams } from "react-router-dom";
import Image from "@/components/Image";
import { CatalogueView } from "@/components/products/catalogue-view";
import { Skeleton } from "@/components/ui/misc";
import { getCategoryBySlug } from "@/lib/data/catalogue";
import { useSeo } from "@/lib/seo";
import { useData } from "@/lib/useData";
import { publicImageUrl } from "@/lib/urls";
import NotFound from "./NotFound";

export default function CategoryPage() {
  const { slug } = useParams();
  const { data: category, loading } = useData(() => getCategoryBySlug(slug), [slug]);
  useSeo({ title: category?.seo_title || category?.name, description: category?.seo_description || category?.description, path: `/categories/${slug}` });

  if (loading) return <div className="container-page py-14"><Skeleton className="h-40" /></div>;
  if (!category) return <NotFound inline />;
  const banner = publicImageUrl(category.image_key);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-white">
        {banner ? <Image src={banner} alt={category.image_alt ?? ""} fill priority sizes="100vw" className="-z-10 object-cover opacity-40" /> : null}
        <div className="container-page py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Category</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{category.name}</h1>
          {category.description ? <p className="mt-3 max-w-2xl text-white/75">{category.description}</p> : null}
        </div>
      </section>
      <div className="container-page py-10">
        <CatalogueView basePath={`/categories/${category.slug}`} fixedCategory={{ id: category.id, slug: category.slug }} />
      </div>
    </>
  );
}
