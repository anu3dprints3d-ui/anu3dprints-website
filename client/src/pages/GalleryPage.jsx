import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { getGallery } from "@/lib/data/catalogue";
import { useSeo } from "@/lib/seo";
import { useData } from "@/lib/useData";
import { publicImageUrl } from "@/lib/urls";

export default function GalleryPage() {
  useSeo({ title: "Gallery", description: "Completed projects, custom prints, prototypes and creative designs from Anu3D Prints.", path: "/gallery" });
  const { data: items, loading } = useData(() => getGallery(), []);
  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">Gallery</h1>
      <p className="mb-8 mt-2 text-muted-foreground">A look at what we have printed.</p>
      {loading ? <Skeleton className="h-64" /> : !items?.length ? (
        <EmptyState title="Gallery coming soon" body="Projects will appear here once they are added." />
      ) : (
        <GalleryGrid items={items.map((g) => ({ id: g.id, src: publicImageUrl(g.storage_key), alt: g.alt_text || g.title || "3D printed project", caption: g.caption, type: g.project_type }))} />
      )}
    </div>
  );
}
