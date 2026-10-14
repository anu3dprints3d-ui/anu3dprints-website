import { EmptyState, Skeleton } from "@/components/ui/misc";
import { getFaqs } from "@/lib/data/catalogue";
import { useSeo } from "@/lib/seo";
import { useData } from "@/lib/useData";

export default function FaqPage() {
  useSeo({ title: "FAQ", description: "Answers about ordering, custom prints, bulk orders and delivery.", path: "/faq" });
  const { data: faqs, loading } = useData(getFaqs, []);
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">Frequently asked questions</h1>
      <div className="mt-8 space-y-3">
        {loading ? <Skeleton className="h-32" /> : null}
        {!loading && !faqs?.length ? <EmptyState title="No FAQs yet" /> : null}
        {(faqs ?? []).map((f) => (
          <details key={f.id} className="rounded-2xl border border-border bg-card px-4">
            <summary className="min-h-11 cursor-pointer py-3.5 font-semibold">{f.question}</summary>
            <p className="whitespace-pre-line pb-4 text-sm text-muted-foreground">{f.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
