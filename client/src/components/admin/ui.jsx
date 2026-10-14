import Link from "@/components/Link";
import { Card } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
export function PageHeader({ title, description, actions }) {
    return (<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>);
}
export function StatCard({ label, value, href, hint }) {
    const body = (<Card className={cn("p-5", href && "transition-shadow hover:shadow-lift")}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>);
    return href ? <Link href={href}>{body}</Link> : body;
}
export function Table({ children, className }) {
    return (<div className={cn("overflow-x-auto rounded-2xl border border-border bg-card shadow-card", className)}>
      <table className="responsive-table w-full text-left text-sm sm:min-w-[40rem]">{children}</table>
    </div>);
}
export const Th = ({ children, className }) => (<th scope="col" className={cn("whitespace-nowrap border-b border-border bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}>{children}</th>);
export const Td = ({ children, className, label, select }) => (<td data-label={label} data-select={select ? "" : undefined} className={cn("border-b border-border/60 px-4 py-3 align-middle", className)}>{children}</td>);
