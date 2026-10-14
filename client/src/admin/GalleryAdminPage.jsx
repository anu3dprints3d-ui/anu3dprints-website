import { PageHeader } from "@/components/admin/ui";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { supabase } from "@/lib/supabase";
import { publicImageUrl } from "@/lib/urls";
import { useData } from "@/lib/useData";

export default function GalleryAdminPage() {
  const { data, loading } = useData(() => supabase.from("gallery_items").select("*").order("sort_order"), []);
  return (
    <>
      <PageHeader title="Gallery" description="Completed projects shown on the Gallery page and homepage." />
      {loading ? <Skeleton className="h-48" /> : data.error ? <EmptyState title="Could not load the gallery" /> : (
        <GalleryManager
          items={(data.data ?? []).map((g) => ({ id: g.id, url: publicImageUrl(g.storage_key), alt_text: g.alt_text, title: g.title, caption: g.caption, project_type: g.project_type, sort_order: g.sort_order, is_published: g.is_published }))}
        />
      )}
    </>
  );
}
