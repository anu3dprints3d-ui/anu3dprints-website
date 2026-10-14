import { MessageCircle } from "lucide-react";
import { usePathname } from "@/lib/nav";
import { buildWhatsAppUrl, generalMessage } from "@shared/whatsapp";
import { cn } from "@/lib/utils";

// Pages with forms or their own WhatsApp call-to-action: on phones the floating button would sit on top of them.
const HIDE_ON_PHONES = ["/products", "/categories", "/custom-3d-printing", "/bulk-orders", "/contact"];

/** Bottom-right chat button. Small on phones (with safe-area padding) and hidden where it would cover controls. */
export function FloatingWhatsApp({ phone }) {
  const pathname = usePathname();
  const hideOnPhones = HIDE_ON_PHONES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  return (
    <a
      href={buildWhatsAppUrl(phone, generalMessage())}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      data-wa-source="floating"
      className={cn(
        "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-30 size-11 place-items-center rounded-full bg-whatsapp text-white shadow-lift transition-transform hover:scale-105 sm:right-4 sm:grid sm:size-14",
        hideOnPhones ? "hidden" : "grid",
      )}
    >
      <MessageCircle className="size-5 sm:size-6" aria-hidden />
    </a>
  );
}
