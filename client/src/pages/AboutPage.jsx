import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/misc";
import { useSettings } from "@/lib/settings";
import { useSeo } from "@/lib/seo";

const CAPABILITIES = ["Personalised gifts & keychains", "Photo (lithophane) lamps", "Toys, figurines & decor", "Functional prototypes & spare parts", "Multi-colour prints", "Bulk & corporate orders"];

export default function AboutPage() {
  useSeo({ title: "About Us", description: "Anu3D Prints is a custom 3D printing studio in Coimbatore, Tamil Nadu.", path: "/about" });
  const { business: b } = useSettings();
  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <SectionHeading eyebrow="About us" title={`${b.name} - ${b.tagline}`} subtitle={`${b.support} We are a custom 3D printing studio based in ${b.location}.`} />
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-xl font-bold">Our mission</h2>
          <p className="mt-2 text-muted-foreground">To make custom manufacturing personal and approachable - turning ideas, photos and CAD files into well-finished physical objects.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-xl font-bold">What we make</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{CAPABILITIES.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/products">Browse products</ButtonLink>
        <ButtonLink href="/custom-3d-printing" variant="dark">Start a custom request</ButtonLink>
      </div>
    </div>
  );
}
