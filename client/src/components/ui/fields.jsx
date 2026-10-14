import * as React from "react";
import { cn } from "@/lib/utils";
const base = "w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-gold-deep focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-60 aria-[invalid=true]:border-danger";
export const Input = React.forwardRef(({ className, ...props }, ref) => <input ref={ref} className={cn(base, "min-h-11", className)} {...props}/>);
Input.displayName = "Input";
export const Textarea = React.forwardRef(({ className, ...props }, ref) => <textarea ref={ref} className={cn(base, "min-h-28 py-3", className)} {...props}/>);
Textarea.displayName = "Textarea";
export const Select = React.forwardRef(({ className, ...props }, ref) => <select ref={ref} className={cn(base, "min-h-11", className)} {...props}/>);
Select.displayName = "Select";
export function Field({ label, error, hint, htmlFor, children, className, }) {
    return (<div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (<p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>) : null}
    </div>);
}
