import { Fragment } from "react";
import { Sparkles } from "lucide-react";

/**
 * Continuously scrolling gold ticker. The list is rendered twice and the track slides by exactly
 * half its width, so the loop is seamless. Pauses on hover/focus; static for reduced-motion users.
 */
export function Marquee({ headline, items }) {
  const row = (
    <ul className="flex shrink-0 items-center">
      {items.map((text) => (
        <li key={text} className="flex items-center whitespace-nowrap">
          <span className="px-5 text-[13px] font-bold uppercase tracking-[0.14em] sm:text-sm">{text}</span>
          <Sparkles className="size-4 shrink-0 text-ink/70" aria-hidden />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label="Our promise" className="relative overflow-hidden border-y border-ink/20 bg-gold text-ink">
      <p className="sr-only">{[headline, ...items].join(". ")}</p>
      <div className="marquee group flex items-center py-2" aria-hidden="true">
        {/* Headline in handwriting style, then the services, repeated for the seamless loop */}
        {[0, 1].map((n) => (
          <Fragment key={n}>
            <div className="flex shrink-0 items-center">
              <span className="font-script shrink-0 px-6 text-2xl font-bold leading-none sm:text-3xl">{headline}</span>
              <Sparkles className="size-4 shrink-0 text-ink/70" aria-hidden />
              {row}
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
