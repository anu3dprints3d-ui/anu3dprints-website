import * as React from "react";
import Link from "@/components/Link";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
export const buttonVariants = cva("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]", {
    variants: {
        variant: {
            primary: "bg-gold text-ink shadow-sm hover:bg-gold-deep hover:shadow-md",
            accent: "bg-accent text-accent-foreground shadow-sm hover:brightness-110",
            dark: "bg-ink text-white hover:bg-black",
            outline: "border border-border bg-card text-foreground hover:border-ink hover:bg-muted",
            ghost: "text-foreground hover:bg-muted",
            whatsapp: "bg-whatsapp text-white shadow-sm hover:brightness-110",
            danger: "bg-danger text-white hover:brightness-110",
        },
        size: { sm: "min-h-9 px-3 text-xs", md: "", lg: "min-h-12 px-7 text-base", icon: "w-11 px-0" },
    },
    defaultVariants: { variant: "primary", size: "md" },
});
export function Button({ className, variant, size, type = "button", ...props }) {
    return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props}/>;
}
export function ButtonLink({ className, variant, size, ...props }) {
    return <Link className={cn(buttonVariants({ variant, size }), className)} {...props}/>;
}
