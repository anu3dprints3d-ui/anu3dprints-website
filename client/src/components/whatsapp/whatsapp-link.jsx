import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@shared/whatsapp";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
/** Single place that renders WhatsApp CTAs: consistent styling, safe external-link attributes. */
export function WhatsAppLink({ phone, message, children = "Enquire on WhatsApp", className, variant = "whatsapp", size, source, }) {
    return (<a href={buildWhatsAppUrl(phone, message)} target="_blank" rel="noopener noreferrer" data-wa-source={source} className={cn(buttonVariants({ variant, size }), className)}>
      <MessageCircle className="size-4.5" aria-hidden/>
      {children}
    </a>);
}
