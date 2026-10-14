import { Building2, Cake, PartyPopper, Wrench } from "lucide-react";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { SectionHeading } from "@/components/ui/misc";
import { useSeo } from "@/lib/seo";

const USES = [
  { icon: Building2, title: "Corporate gifting", body: "Branded desk items, awards and welcome kits." },
  { icon: PartyPopper, title: "Event merchandise", body: "Souvenirs and giveaways for launches and conferences." },
  { icon: Cake, title: "Return gifts", body: "Keychains, mini figurines and more for birthdays and weddings." },
  { icon: Wrench, title: "Industrial prototypes", body: "Small-batch parts and fit-check models." },
];

export default function BulkOrdersPage() {
  useSeo({ title: "Bulk Orders & Corporate Gifts", description: "Corporate gifting, event merchandise, return gifts and branded 3D printed items in bulk. Request a quotation on WhatsApp.", path: "/bulk-orders" });
  return (
    <div className="container-page py-10 sm:py-14">
      <SectionHeading eyebrow="Bulk orders" title="Gifts and parts, in quantity." subtitle="Share what you need, how many, and by when. We reply on WhatsApp with options and a quotation. Minimum 10 pieces." />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          {USES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold-deep"><Icon className="size-5" aria-hidden /></span>
              <div><h3 className="font-bold">{title}</h3><p className="text-sm text-muted-foreground">{body}</p></div>
            </div>
          ))}
          <div className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">How to request a quote</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Fill in the form with quantity, item and branding needs.</li>
              <li>We save your enquiry and open WhatsApp with the details.</li>
              <li>We confirm price, samples and timeline directly with you.</li>
            </ol>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8">
          <h2 className="mb-5 text-xl font-bold">Bulk order enquiry</h2>
          <EnquiryForm type="bulk_order" />
        </div>
      </div>
    </div>
  );
}
