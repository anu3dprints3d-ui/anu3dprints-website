import Link from "@/components/Link";
import { useState, useTransition } from "react";
import { useRouter } from "@/lib/nav";
import { toast } from "sonner";
import { deleteCategory, setCategoryActive } from "@/api";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/fields";
export function CategoryRowActions({ id, name, active, productCount, others }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [confirming, setConfirming] = useState(false);
    const [target, setTarget] = useState("");
    function done(res) {
        if (res.ok) {
            toast.success(res.message);
            setConfirming(false);
            router.refresh();
        }
        else
            toast.error(res.message ?? "Failed");
    }
    return (<div className="flex flex-wrap items-center justify-end gap-1">
      <Link href={`/admin/categories/${id}`} className="rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-muted">Edit</Link>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => done(await setCategoryActive(id, !active)))}>{active ? "Archive" : "Activate"}</Button>
      <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirming(true)}>Delete</Button>
      {confirming ? (<div role="alertdialog" aria-label={`Delete ${name}`} className="mt-2 w-full space-y-2 rounded-xl border border-border bg-card p-3 text-left shadow-lift">
          <p className="text-sm">Delete <strong>{name}</strong>?{productCount > 0 ? ` ${productCount} product(s) use it - choose where to move them.` : ""}</p>
          {productCount > 0 ? (<Select aria-label="Move products to" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Move products to...</option>
              {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>) : null}
          <div className="flex gap-2">
            <Button size="sm" variant="danger" disabled={pending || (productCount > 0 && !target)} onClick={() => start(async () => done(await deleteCategory({ id, reassignTo: target || undefined })))}>Confirm delete</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        </div>) : null}
    </div>);
}
