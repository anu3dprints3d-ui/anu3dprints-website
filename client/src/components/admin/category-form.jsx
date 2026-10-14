import Image from "@/components/Image";
import { useActionState, useEffect } from "react";
import { useRouter } from "@/lib/nav";
import { toast } from "sonner";
import { saveCategory } from "@/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/fields";
import { ImageInput } from "@/components/ui/image-input";
import { Card } from "@/components/ui/misc";
export function CategoryForm({ category, imageUrl }) {
    const router = useRouter();
    const [state, action, pending] = useActionState(saveCategory, {});
    const e = state.fieldErrors ?? {};
    useEffect(() => {
        if (!state.message)
            return;
        if (state.ok) {
            toast.success(state.message);
            router.push("/admin/categories");
            router.refresh();
        }
        else
            toast.error(state.message);
    }, [state, router]);
    return (<form action={action}>
      <Card className="space-y-4 p-5 sm:p-6">
        {category ? <input type="hidden" name="id" value={category.id}/> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={e.name}><Input id="name" name="name" defaultValue={category?.name} required/></Field>
          <Field label="Slug" htmlFor="slug" error={e.slug} hint="Blank = generated from name"><Input id="slug" name="slug" defaultValue={category?.slug}/></Field>
        </div>
        <Field label="Description" htmlFor="description" error={e.description}><Textarea id="description" name="description" defaultValue={category?.description ?? ""}/></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display order" htmlFor="sort_order"><Input id="sort_order" name="sort_order" type="number" min="0" defaultValue={category?.sort_order ?? 0}/></Field>
          <label className="flex min-h-11 items-center gap-2 self-end text-sm font-medium"><input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} className="size-4"/> Visible on the website</label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO title" htmlFor="seo_title" error={e.seo_title}><Input id="seo_title" name="seo_title" maxLength={70} defaultValue={category?.seo_title ?? ""}/></Field>
          <Field label="SEO description" htmlFor="seo_description" error={e.seo_description}><Input id="seo_description" name="seo_description" maxLength={160} defaultValue={category?.seo_description ?? ""}/></Field>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Category image</p>
          {imageUrl ? <div className="relative h-32 w-52 overflow-hidden rounded-xl bg-muted"><Image src={imageUrl} alt={category?.image_alt ?? ""} fill sizes="208px" className="object-cover"/></div> : null}
          <ImageInput name="image" aria-invalid={!!e.image} />
          {e.image ? <p role="alert" className="text-xs text-danger">{e.image}</p> : <p className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 5 MB. Uploading replaces the current image.</p>}
          <Field label="Image alt text" htmlFor="image_alt"><Input id="image_alt" name="image_alt" defaultValue={category?.image_alt ?? ""}/></Field>
        </div>
        <div className="flex justify-end"><Button type="submit" disabled={pending}>{category ? "Save category" : "Create category"}</Button></div>
      </Card>
    </form>);
}
