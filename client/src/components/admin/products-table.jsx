import Image from "@/components/Image";
import Link from "@/components/Link";
import { useState, useTransition } from "react";
import { useRouter } from "@/lib/nav";
import { Box, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { bulkProductAction, duplicateProduct } from "@/api";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/fields";
import { Badge } from "@/components/ui/misc";
import { Table, Td, Th } from "@/components/admin/ui";
import { formatINR } from "@shared/format";
export function ProductsTable({ rows, categories }) {
    const router = useRouter();
    const [selected, setSelected] = useState(new Set());
    const [pending, start] = useTransition();
    const [cat, setCat] = useState("");
    const toggle = (id) => setSelected((s) => {
        const n = new Set(s);
        if (n.has(id))
            n.delete(id);
        else
            n.add(id);
        return n;
    });
    function run(action) {
        if (action === "archive" && !confirm(`Archive ${selected.size} product(s)? They will be hidden from the site.`))
            return;
        start(async () => {
            const res = await bulkProductAction({ ids: [...selected], action, categoryId: cat || undefined });
            if (res.ok) {
                toast.success(res.message);
                setSelected(new Set());
                router.refresh();
            }
            else
                toast.error(res.message ?? "Failed");
        });
    }
    function duplicate(id) {
        start(async () => {
            const res = await duplicateProduct(id);
            if (res.ok) {
                toast.success(res.message);
                router.push(`/admin/products/${res.id}`);
            }
            else
                toast.error(res.message ?? "Failed");
        });
    }
    return (<>
      {selected.size > 0 ? (<div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-gold bg-gold/15 p-3" role="region" aria-label="Bulk actions">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run("publish")}>Publish</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run("unpublish")}>Unpublish</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run("archive")}>Archive</Button>
          <Select aria-label="Category for bulk assignment" className="min-h-9 w-auto text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Assign category...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Button size="sm" disabled={pending || !cat} onClick={() => run("set_category")}>Assign</Button>
        </div>) : null}
      <Table>
        <thead>
          <tr>
            <Th className="w-10"><span className="sr-only">Select</span></Th>
            <Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>Status</Th><Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (<tr key={p.id} className="hover:bg-muted/40">
              <Td select><input type="checkbox" className="size-4" aria-label={`Select ${p.name}`} checked={selected.has(p.id)} onChange={() => toggle(p.id)}/></Td>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p.image ? <Image src={p.image} alt="" fill sizes="48px" className="object-cover"/> : <Box className="m-3 size-6 text-muted-foreground/50" aria-hidden/>}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                    <p className="text-xs text-muted-foreground">{p.sku ?? "No SKU"}</p>
                  </div>
                </div>
              </Td>
              <Td label="Category">{p.category ?? "-"}</Td>
              <Td label="Price">{formatINR(p.price)}</Td>
              <Td label="Status">
                <div className="flex flex-wrap gap-1">
                  {p.archived_at ? <Badge tone="neutral">Archived</Badge> : p.is_published ? <Badge tone="green">Published</Badge> : <Badge tone="gold">Draft</Badge>}
                  {p.is_featured ? <Badge tone="dark">Featured</Badge> : null}
                </div>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`} className="grid size-9 place-items-center rounded-lg hover:bg-muted"><Pencil className="size-4"/></Link>
                  <button type="button" aria-label={`Duplicate ${p.name}`} disabled={pending} onClick={() => duplicate(p.id)} className="grid size-9 place-items-center rounded-lg hover:bg-muted"><Copy className="size-4"/></button>
                </div>
              </Td>
            </tr>))}
        </tbody>
      </Table>
    </>);
}
