import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { WhatsAppLink } from "@/components/whatsapp/whatsapp-link";
import { useSettings } from "@/lib/settings";
import { useSeo } from "@/lib/seo";
import { generalMessage } from "@shared/whatsapp";

export default function ContactPage() {
  useSeo({ title: "Contact", description: "Contact Anu3D Prints in Coimbatore by WhatsApp, phone, email or enquiry form.", path: "/contact" });
  const { business: b } = useSettings();
  const rows = [
    { icon: MapPin, label: "Location", value: b.address || b.location },
    b.phone ? { icon: Phone, label: "Phone", value: b.phone, href: `tel:${b.phone}` } : null,
    b.email ? { icon: Mail, label: "Email", value: b.email, href: `mailto:${b.email}` } : null,
    b.hours ? { icon: Clock, label: "Hours", value: b.hours } : null,
  ].filter(Boolean);

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">Contact us</h1>
      <p className="mb-10 mt-2 text-muted-foreground">The quickest way to reach us is WhatsApp.</p>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <WhatsAppLink phone={b.whatsapp} message={generalMessage()} size="lg" source="contact-page"><span>Chat on WhatsApp</span></WhatsAppLink>
          <ul className="space-y-4">
            {rows.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold-deep"><Icon className="size-5" aria-hidden /></span>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>{href ? <a href={href} className="inline-block break-all py-2 font-medium">{value}</a> : <p className="font-medium">{value}</p>}</div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-x-5 text-sm font-semibold [&>a]:inline-block [&>a]:py-2.5">
            {b.instagram ? <a href={b.instagram} target="_blank" rel="noopener noreferrer">Instagram</a> : null}
            {b.facebook ? <a href={b.facebook} target="_blank" rel="noopener noreferrer">Facebook</a> : null}
            {b.map_url ? <a href={b.map_url} target="_blank" rel="noopener noreferrer">Get directions</a> : null}
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8">
          <h2 className="mb-1 flex items-center gap-2 text-xl font-bold"><MessageCircle className="size-5" aria-hidden /> Send a message</h2>
          <p className="mb-5 text-sm text-muted-foreground">We save your message and open WhatsApp so we can reply there.</p>
          <EnquiryForm type="contact" submitLabel="Send message" />
        </div>
      </div>
    </div>
  );
}
