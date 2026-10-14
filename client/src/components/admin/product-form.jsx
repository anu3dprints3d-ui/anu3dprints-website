import { useActionState, useEffect } from "react";
import { useRouter } from "@/lib/nav";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveProduct } from "@/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { Card } from "@/components/ui/misc";
import { AVAILABILITY_LABELS } from "@shared/constants";
function Check({ name, label, defaultChecked }) {
    return (<label className="flex min-h-11 items-center gap-2 text-sm font-medium">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4"/> {label}
    </label>);
}
export function ProductForm({ product, categories, extraCategoryIds, }) {
    const router = useRouter();
    const [state, action, pending] = useActionState(saveProduct, {});
    const e = state.fieldErrors ?? {};
    useEffect(() => {
        if (!state.message)
            return;
        if (state.ok) {
            toast.success(state.message);
            if (!product && state.id)
                router.push(`/admin/products/${state.id}`);
            else
                router.refresh();
        }
        else
            toast.error(state.message);
    }, [state, product, router]);
    const specs = (product?.specifications ?? []).map((s) => `${s.label}: ${s.value}`).join("\n");
    return (<form action={action} className="space-y-6">
      {product ? <input type="hidden" name="id" value={product.id}/> : null}

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" htmlFor="name" error={e.name}><Input id="name" name="name" defaultValue={product?.name} required/></Field>
          <Field label="Slug (URL)" htmlFor="slug" error={e.slug} hint="Leave blank to generate from the name"><Input id="slug" name="slug" defaultValue={product?.slug}/></Field>
          <Field label="SKU" htmlFor="sku" error={e.sku}><Input id="sku" name="sku" defaultValue={product?.sku ?? ""}/></Field>
          <Field label="Primary category" htmlFor="primary_category_id" error={e.primary_category_id}>
            <Select id="primary_category_id" name="primary_category_id" defaultValue={product?.primary_category_id ?? ""}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Also show in categories" htmlFor="extra_categories" hint="Hold Ctrl/Cmd to select several">
          <Select id="extra_categories" name="extra_categories" multiple defaultValue={extraCategoryIds} className="h-32">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Short description" htmlFor="short_description" error={e.short_description}><Input id="short_description" name="short_description" defaultValue={product?.short_description ?? ""}/></Field>
        <Field label="Full description" htmlFor="description" error={e.description}><Textarea id="description" name="description" defaultValue={product?.description ?? ""} className="min-h-40"/></Field>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Pricing &amp; availability</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (₹)" htmlFor="price" error={e.price}><Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product?.price ?? ""} required/></Field>
          <Field label="Sale price (₹)" htmlFor="sale_price" error={e.sale_price}><Input id="sale_price" name="sale_price" type="number" step="0.01" min="0" defaultValue={product?.sale_price ?? ""}/></Field>
          <Field label="Availability" htmlFor="availability">
            <Select id="availability" name="availability" defaultValue={product?.availability ?? "made_to_order"}>
              {Object.entries(AVAILABILITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Stock quantity" htmlFor="stock_quantity" hint="Optional"><Input id="stock_quantity" name="stock_quantity" type="number" min="0" defaultValue={product?.stock_quantity ?? ""}/></Field>
          <Field label="Lead time" htmlFor="lead_time"><Input id="lead_time" name="lead_time" placeholder="3-5 days" defaultValue={product?.lead_time ?? ""}/></Field>
          <Field label="Approx. print duration" htmlFor="print_duration"><Input id="print_duration" name="print_duration" placeholder="4 hours" defaultValue={product?.print_duration ?? ""}/></Field>
        </div>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Options &amp; specifications</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Materials" htmlFor="material_options" hint="Comma separated"><Input id="material_options" name="material_options" defaultValue={product?.material_options.join(", ")}/></Field>
          <Field label="Colours" htmlFor="color_options" hint="Comma separated"><Input id="color_options" name="color_options" defaultValue={product?.color_options.join(", ")}/></Field>
          <Field label="Sizes" htmlFor="size_options" hint="Comma separated"><Input id="size_options" name="size_options" defaultValue={product?.size_options.join(", ")}/></Field>
          <Field label="Dimensions" htmlFor="dimensions"><Input id="dimensions" name="dimensions" defaultValue={product?.dimensions ?? ""}/></Field>
          <Field label="Weight (g)" htmlFor="weight_grams"><Input id="weight_grams" name="weight_grams" type="number" min="0" step="0.1" defaultValue={product?.weight_grams ?? ""}/></Field>
        </div>
        <Field label="Specifications" htmlFor="specifications" hint="One per line as Label: value"><Textarea id="specifications" name="specifications" defaultValue={specs}/></Field>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Visibility &amp; SEO</h2>
        <div className="flex flex-wrap gap-x-6">
          <Check name="is_published" label="Published" defaultChecked={product?.is_published}/>
          <Check name="is_featured" label="Featured" defaultChecked={product?.is_featured}/>
          <Check name="is_popular" label="Popular" defaultChecked={product?.is_popular}/>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Sort order" htmlFor="sort_order"><Input id="sort_order" name="sort_order" type="number" min="0" defaultValue={product?.sort_order ?? 0}/></Field>
          <Field label="SEO title" htmlFor="seo_title" error={e.seo_title}><Input id="seo_title" name="seo_title" maxLength={70} defaultValue={product?.seo_title ?? ""}/></Field>
          <Field label="SEO description" htmlFor="seo_description" error={e.seo_description}><Input id="seo_description" name="seo_description" maxLength={160} defaultValue={product?.seo_description ?? ""}/></Field>
        </div>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-border bg-card/95 p-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        {state.message && !state.ok ? <p role="alert" className="mr-auto text-sm text-danger">{state.message}</p> : null}
        <Button type="submit" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" aria-hidden/> : null} {product ? "Save changes" : "Create product"}</Button>
      </div>
    </form>);
}
