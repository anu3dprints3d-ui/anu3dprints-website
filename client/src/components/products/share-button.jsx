import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
export function ShareButton({ title, url }) {
    async function share() {
        try {
            if (navigator.share) {
                await navigator.share({ title, url });
                return;
            }
            await navigator.clipboard.writeText(url);
            toast.success("Link copied");
        }
        catch {
            /* user cancelled or clipboard blocked */
        }
    }
    return (<Button variant="outline" onClick={share}>
      <Share2 className="size-4" aria-hidden/> Share
    </Button>);
}
