import Link from "@/components/Link";
import { usePathname } from "@/lib/nav";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, MessageCircle, X } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import { buildWhatsAppUrl, generalMessage } from "@shared/whatsapp";

const NAV = [
  { href: "/", label: "Home", exact: true },
  { href: "/products", label: "Products" },
  { href: "/custom-3d-printing", label: "Custom 3D Printing" },
  { href: "/bulk-orders", label: "Bulk Orders" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ logo }) {
  const pathname = usePathname();
  const { business: b } = useSettings();
  // Menu is "open" only for the route it was opened on, so navigating closes it without an effect.
  const [openFor, setOpenFor] = useState(null);
  const open = openFor === pathname;
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
  const iconBtn = "grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-gold";

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-4">
        {logo}
        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "relative rounded-md px-3 py-2 text-[13px] font-medium text-white/75 transition-colors hover:text-white",
                isActive(item) && "text-white after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-gold",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          {b.instagram ? (
            <a href={b.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={cn(iconBtn, "hidden sm:grid")}>
              <InstagramIcon className="size-[18px]" />
            </a>
          ) : null}
          <a href={buildWhatsAppUrl(b.whatsapp, generalMessage())} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className={cn(iconBtn, "hidden sm:grid")}>
            <MessageCircle className="size-[18px]" />
          </a>
          <Link href="/custom-3d-printing" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "ml-1 hidden gap-1.5 rounded-lg sm:inline-flex")}>
            Get a Quote <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg border border-white/15 text-white lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenFor(open ? null : pathname)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
    </header>
      {open ? (
        <nav id="mobile-nav" aria-label="Mobile" className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto bg-ink px-4 pb-8 pt-4 lg:hidden">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={cn("flex min-h-12 items-center rounded-xl px-3 text-lg font-semibold text-white/85 hover:bg-white/10", isActive(item) && "text-gold")}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/custom-3d-printing" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-6 w-full")}>
            Get a Custom Quote
          </Link>
        </nav>
      ) : null}
    </>
  );
}
