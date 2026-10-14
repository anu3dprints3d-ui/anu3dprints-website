import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Logo } from "@/components/layout/logo";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { getCategories } from "@/lib/data/catalogue";
import { useData } from "@/lib/useData";
import { useSettings } from "@/lib/settings";

export default function PublicLayout() {
  const settings = useSettings();
  const { pathname } = useLocation();
  const { data: categories } = useData(getCategories, []);
  const b = settings.business;

  useEffect(() => {
    window.scrollTo(0, 0); // braces: newer Chrome returns a Promise, which React would treat as a cleanup function
  }, [pathname]);

  if (settings.maintenance.enabled) {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <Logo name={b.name} logoKey={b.logo_key} className="mb-6" />
          <h1 className="text-3xl font-bold">We&apos;ll be back shortly</h1>
          <p className="mt-2 text-muted-foreground">The site is undergoing scheduled maintenance.</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2">
        Skip to content
      </a>
      {settings.announcement.enabled && settings.announcement.text ? (
        <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-gold sm:text-sm">{settings.announcement.text}</div>
      ) : null}
      <SiteHeader logo={<Logo name={b.name} logoKey={b.logo_key} dark />} />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter settings={settings} categories={(categories ?? []).filter((c) => c.is_active)} />
      <FloatingWhatsApp phone={b.whatsapp} />
    </>
  );
}
