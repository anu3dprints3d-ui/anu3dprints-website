import Link from "@/components/Link";
import { Check, MapPin, MessageCircle, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import { Logo } from "./logo";
import { buildWhatsAppUrl, generalMessage } from "@shared/whatsapp";

const QUICK = [
  ["/", "Home"],
  ["/about", "About Us"],
  ["/products", "Products"],
  ["/contact", "Contact"],
  ["/custom-3d-printing", "Custom 3D Printing"],
  ["/gallery", "Gallery"],
  ["/bulk-orders", "Bulk Orders"],
  ["/faq", "FAQ"],
];

const SERVICES = ["Custom 3D Printing", "Personalised Gifts", "Engineering Prototypes", "Bulk Orders"];

export function SiteFooter({ settings }) {
  const b = settings.business;
  return (
    <footer className="mt-14 bg-[#0d0b08] text-[13px] text-white/70">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.4fr_1.2fr_1fr]">
        <div className="space-y-3">
          <Logo name={b.name} logoKey={b.logo_key} dark large />
          <p className="max-w-xs text-white/60">{b.tagline}. {b.support}</p>
        </div>

        <nav aria-label="Quick links">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Quick Links</h3>
          <ul className="grid grid-cols-2 gap-x-4">
            {QUICK.map(([href, label]) => (
              <li key={href}><Link className="inline-block py-2.5 transition-colors hover:text-gold sm:py-1.5" href={href}>{label}</Link></li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Contact Us</h3>
          <ul className="space-y-2.5">
            {b.phone ? <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden /><a href={`tel:${b.phone}`} className="inline-block py-1.5">{b.phone}</a></li> : null}
            <li className="flex gap-2"><MessageCircle className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden /><a href={buildWhatsAppUrl(b.whatsapp, generalMessage())} target="_blank" rel="noopener noreferrer" className="inline-block py-1.5 hover:text-gold">Chat on WhatsApp</a></li>
            <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />{b.address || b.location}</li>
            {b.instagram ? <li className="flex gap-2"><InstagramIcon className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden /><a href={b.instagram} target="_blank" rel="noopener noreferrer" className="inline-block py-1.5 hover:text-gold">Follow us on Instagram</a></li> : null}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Our Services</h3>
          <ul className="space-y-2">
            {SERVICES.map((s) => <li key={s} className="flex items-center gap-2"><Check className="size-3.5 text-gold" aria-hidden />{s}</li>)}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {b.name}. Enquiries only - orders and payments are arranged directly with us on WhatsApp.</p>
          <ul className="flex flex-wrap gap-x-5">
            <li><Link href="/privacy-policy" className="inline-block py-2 hover:text-gold">Privacy</Link></li>
            <li><Link href="/terms-and-conditions" className="inline-block py-2 hover:text-gold">Terms</Link></li>
            <li><Link href="/shipping-and-delivery" className="inline-block py-2 hover:text-gold">Shipping</Link></li>
            <li><Link href="/cancellation-and-refund-policy" className="inline-block py-2 hover:text-gold">Cancellations</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
