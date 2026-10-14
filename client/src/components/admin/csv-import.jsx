import { useActionState } from "react";
import { Upload } from "lucide-react";
import { importProductsCsv } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
export function CsvImport() {
    const [state, action, pending] = useActionState(importProductsCsv, {});
    return (<details className="mb-6 rounded-2xl border border-border bg-card p-4">
      <summary className="cursor-pointer text-sm font-semibold">Import products from CSV</summary>
      <form action={action} className="mt-3 space-y-3">
        <p className="text-xs text-muted-foreground">
          Columns: name, price (required); slug, sku, short_description, description, sale_price, category (slug), material_options, color_options, size_options (use | between values), availability, lead_time, is_published, is_featured. Use Export to get a template. Validated first - if any row is invalid nothing is imported.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input name="file" type="file" accept=".csv,text/csv" required className="max-w-xs"/>
          <Button type="submit" disabled={pending}><Upload className="size-4" aria-hidden/> Import</Button>
        </div>
        {state.message ? <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>{state.message}</p> : null}
      </form>
    </details>);
}
