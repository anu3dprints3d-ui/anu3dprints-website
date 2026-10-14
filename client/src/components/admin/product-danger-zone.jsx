import { useTransition } from "react";
import { useRouter } from "@/lib/nav";
import { toast } from "sonner";
import { archiveProduct, deleteProduct } from "@/api";
import { Button } from "@/components/ui/button";
export function ProductDangerZone({ productId, archived }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    function run(fn, redirectTo) {
        start(async () => {
            const res = await fn();
            if (res.ok) {
                toast.success(res.message);
                if (redirectTo)
                    router.push(redirectTo);
                else
                    router.refresh();
            }
            else
                toast.error(res.message ?? "Failed");
        });
    }
    return (<div className="flex flex-wrap gap-3">
      {archived ? (<>
          <Button disabled={pending} onClick={() => run(() => archiveProduct(productId, false, true))}>
            Restore &amp; publish
          </Button>
          <Button variant="outline" disabled={pending} onClick={() => run(() => archiveProduct(productId, false, false))}>
            Restore as before
          </Button>
        </>) : (<Button variant="outline" disabled={pending} onClick={() => run(() => archiveProduct(productId, true))}>
          Archive product
        </Button>)}
      <Button variant="danger" disabled={pending} onClick={() => {
            if (confirm("Delete this product and its images permanently? This cannot be undone."))
                run(() => deleteProduct(productId), "/admin/products");
        }}>
        Delete permanently
      </Button>
    </div>);
}
