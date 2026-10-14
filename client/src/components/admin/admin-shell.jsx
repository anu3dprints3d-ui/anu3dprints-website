import Link from "@/components/Link";
import { usePathname } from "@/lib/nav";
import { useState } from "react";
import { Box, FileText, Image as ImageIcon, LayoutDashboard, LogOut, Menu, MessageSquare, Package, PanelLeftClose, PanelLeftOpen, Settings, Tags, Users, X } from "lucide-react";
import { signOut } from "@/api";
import { cn } from "@/lib/utils";
const ICONS = {
    dashboard: LayoutDashboard,
    products: Package,
    categories: Tags,
    gallery: ImageIcon,
    enquiries: MessageSquare,
    content: FileText,
    settings: Settings,
    users: Users,
};
export function AdminShell({ nav, user, children, }) {
    const pathname = usePathname();
    const [drawerFor, setDrawerFor] = useState(null);
    const drawer = drawerFor === pathname;
    const setDrawer = (v) => setDrawerFor(v ? pathname : null);
    const [collapsed, setCollapsed] = useState(false);
    const links = (compact) => (<nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto p-3">
      {nav.map((item) => {
            const Icon = ICONS[item.icon] ?? Box;
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (<Link key={item.href} href={item.href} title={compact ? item.label : undefined} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors", active ? "bg-gold text-ink" : "text-white/75 hover:bg-white/10 hover:text-white", compact && "justify-center px-0")}>
            <Icon className="size-5 shrink-0" aria-hidden/>
            {compact ? <span className="sr-only">{item.label}</span> : item.label}
          </Link>);
        })}
    </nav>);
    return (<div className="flex min-h-dvh bg-muted/60">
      <aside className={cn("sticky top-0 hidden h-dvh flex-col bg-ink transition-[width] duration-200 lg:flex", collapsed ? "w-[4.5rem]" : "w-64")}>
        <div className={cn("flex h-16 items-center gap-2.5 px-4 text-white", collapsed && "justify-center px-0")}>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold text-ink"><Box className="size-5" aria-hidden/></span>
          {collapsed ? null : <span className="font-display font-extrabold">Anu3D Admin</span>}
        </div>
        {links(collapsed)}
        <button type="button" onClick={() => setCollapsed((v) => !v)} className="m-3 flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <PanelLeftOpen className="size-5"/> : <><PanelLeftClose className="size-5"/> Collapse</>}
        </button>
      </aside>

      {drawer ? (<div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)}/>
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-ink">
            <div className="flex h-16 items-center justify-between px-4 text-white">
              <span className="font-display font-extrabold">Anu3D Admin</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="grid size-10 place-items-center rounded-lg hover:bg-white/10"><X className="size-5"/></button>
            </div>
            {links(false)}
          </aside>
        </div>) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4">
          <button type="button" className="grid size-11 place-items-center rounded-xl border border-border lg:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}>
            <Menu className="size-5"/>
          </button>
          <Breadcrumbs pathname={pathname}/>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <p className="font-semibold">{user.email}</p>
              <p className="text-muted-foreground">{user.roleLabels.join(", ")}</p>
            </div>
            <form action={signOut}>
              <button type="submit" className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium hover:bg-muted">
                <LogOut className="size-4" aria-hidden/> <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>);
}
function Breadcrumbs({ pathname }) {
    const parts = pathname.split("/").filter(Boolean).slice(1);
    return (<nav aria-label="Breadcrumb" className="min-w-0 truncate text-sm text-muted-foreground">
      <Link href="/admin" className="hover:text-ink">Admin</Link>
      {parts.map((p, i) => (<span key={i}>
          {" / "}
          {i === parts.length - 1 ? <span className="font-medium capitalize text-ink">{p.length > 20 ? "details" : p}</span> : <span className="capitalize">{p}</span>}
        </span>))}
    </nav>);
}
