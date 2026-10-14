import { toast } from "sonner";
import { Input } from "@/components/ui/fields";
import { compressImage, MAX_SEND_BYTES, RAW_IMAGE_LIMIT } from "@/lib/imageCompress";

/**
 * <input type="file"> that shrinks chosen photos in the browser before the form is submitted.
 * Works with plain <form> posts: it swaps the input's files for the compressed ones.
 */
export function ImageInput({ onChange, ...props }) {
  async function handle(e) {
    const input = e.currentTarget;
    const files = [...(input.files ?? [])];
    if (files.length) {
      const dt = new DataTransfer();
      for (const f of files) {
        if (f.size > RAW_IMAGE_LIMIT) {
          toast.error(`${f.name} is larger than 25 MB.`);
          continue;
        }
        const out = await compressImage(f);
        if (out.type.startsWith("image/") && out.size > MAX_SEND_BYTES) {
          toast.error(`${f.name} is still too large after shrinking. Try a smaller image.`);
          continue;
        }
        dt.items.add(out);
      }
      input.files = dt.files;
    }
    onChange?.(e);
  }
  return <Input type="file" accept="image/jpeg,image/png,image/webp" {...props} onChange={handle} />;
}
