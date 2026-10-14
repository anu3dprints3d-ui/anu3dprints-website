import * as React from "react";
import { cn } from "@/lib/utils";
export function Badge({ className, tone = "neutral", ...props }) {
    const tones = {
        neutral: "bg-muted text-foreground",
        gold: "bg-gold/20 text-[#7a5600]",
        green: "bg-green-100 text-green-800",
        red: "bg-red-100 text-red-800",
        blue: "bg-sky-100 text-sky-800",
        dark: "bg-ink text-white",
    };
    return (<span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)} {...props}/>);
}
export function Card({ className, ...props }) {
    return <div className={cn("rounded-2xl border border-border bg-card shadow-card", className)} {...props}/>;
}
export function EmptyState({ title, body, action }) {
    return (<div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/50 px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {body ? <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>);
}
export function SectionHeading({ eyebrow, title, subtitle, align = "left", className, }) {
    return (<div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">{eyebrow}</p> : null}
      <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-muted-foreground">{subtitle}</p> : null}
    </div>);
}
export function Skeleton({ className }) {
    return <div className={cn("animate-pulse rounded-xl bg-muted", className)}/>;
}
