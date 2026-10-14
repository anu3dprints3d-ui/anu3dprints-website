import { FileBox, MessageCircle, Printer, Truck } from "lucide-react";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { SectionHeading } from "@/components/ui/misc";
import { useSeo } from "@/lib/seo";

const STEPS = [
  { icon: FileBox, title: "Share your design", body: "Upload an STL/STEP/3MF file, a sketch or reference photos - or just describe the idea." },
  { icon: MessageCircle, title: "Get a quotation", body: "We review feasibility, suggest material and size, then send price and timeline on WhatsApp." },
  { icon: Printer, title: "We print & finish", body: "Printed, cleaned and checked before dispatch." },
  { icon: Truck, title: "Pickup or delivery", body: "Collect in Coimbatore or we ship across India." },
];

export default function CustomPrintPage() {
  useSeo({ title: "Custom 3D Printing", description: "Send your STL, STEP, 3MF file or just an idea and get a custom 3D printing quotation on WhatsApp.", path: "/custom-3d-printing" });
  return (
    <div className="container-page py-10 sm:py-14">
      <SectionHeading eyebrow="Custom 3D printing" title="Your idea, printed." subtitle="Prototypes, spare parts, personalised gifts, models. Tell us what you need - we confirm price and timeline directly with you. There is no online payment on this site." />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-8">
          <ol className="space-y-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold-deep"><Icon className="size-5" aria-hidden /></span>
                <div><h3 className="font-bold">{i + 1}. {title}</h3><p className="text-sm text-muted-foreground">{body}</p></div>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Good to know</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Accepted files: STL, STEP/STP, 3MF, images, PDF, ZIP (24 MB total).</li>
              <li>Final price depends on size, material, print time and finishing - we do not auto-quote.</li>
              <li>Your files are stored privately and used only to prepare your quote.</li>
            </ul>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8">
          <h2 className="mb-5 text-xl font-bold">Request a quotation</h2>
          <EnquiryForm type="custom_print" />
        </div>
      </div>
    </div>
  );
}
