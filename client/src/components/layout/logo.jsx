import Image from "@/components/Image";
import Link from "@/components/Link";
import { publicImageUrl } from "@/lib/urls";
import { cn } from "@/lib/utils";

// Bundled circular badge (transparent outside the gold ring) - the default brand mark.
const BADGE = { src: "/images/logo-160.webp", srcSet: "/images/logo-160.webp 160w, /images/logo-512.webp 512w" };

/** The original logo was uploaded as a black-background JPEG; it is replaced by the cut-out badge above. */
const isLegacyJpeg = (key) => /anulogo\.jpe?g/i.test(key ?? "");

function Wordmark({ name, dark, large }) {
  const match = name.match(/^(.*?)(3D)(.*)$/i);
  const tone = dark ? "text-white" : "text-ink";
  const size = large ? "text-xl" : "text-lg";
  if (!match) return <span className={cn("font-display font-extrabold leading-none", size, tone)}>{name}</span>;
  return (
    <span className={cn("font-display font-extrabold leading-none tracking-tight", size, tone)}>
      {match[1]}
      <span className="text-gold">{match[2]}</span>
      <span className="font-semibold">{match[3]}</span>
    </span>
  );
}

/**
 * Brand mark: circular badge + site name. An admin-uploaded logo (Settings) replaces the badge;
 * the old black-background JPEG URL is treated as "use the bundled badge".
 */
export function Logo({ name, logoKey, dark, large, className }) {
  const custom = logoKey && !isLegacyJpeg(logoKey) ? publicImageUrl(logoKey) : null;
  const box = large ? "size-14" : "size-11";
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label={`${name} home`}>
      {custom ? (
        // An uploaded logo may have a light background, so on dark bars it sits on a small white tile.
        <span className={cn("inline-flex items-center rounded-lg", dark && "bg-white px-2 py-1")}>
          <Image src={custom} alt="" width={160} height={40} className="h-9 w-auto" priority />
        </span>
      ) : (
        <img
          {...BADGE}
          sizes="56px"
          alt=""
          width="56"
          height="56"
          className={cn(
            box,
            "shrink-0 rounded-full shadow-[0_0_0_1.5px_rgba(245,183,0,0.45),0_0_16px_rgba(245,183,0,0.28)] transition-shadow duration-300 group-hover:shadow-[0_0_0_2px_rgba(245,183,0,0.8),0_0_22px_rgba(245,183,0,0.5)]",
          )}
        />
      )}
      <span className="flex flex-col gap-1">
        <Wordmark name={name} dark={dark} large={large} />
        <span className={cn("text-[9px] font-medium tracking-[0.2em]", dark ? "text-white/60" : "text-muted-foreground")}>IDEAS · DESIGNED · PRINTED</span>
      </span>
    </Link>
  );
}
