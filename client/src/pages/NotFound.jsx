import { ButtonLink } from "@/components/ui/button";

export default function NotFound({ inline }) {
  return (
    <div className={inline ? "grid place-items-center p-6 py-24 text-center" : "grid min-h-dvh place-items-center p-6 text-center"}>
      <div>
        <p className="font-display text-6xl font-extrabold text-gold-deep">404</p>
        <h1 className="mt-2 text-2xl font-bold">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-muted-foreground">It may have moved, or the product is no longer available.</p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/">Home</ButtonLink>
          <ButtonLink href="/products" variant="outline">Browse products</ButtonLink>
        </div>
      </div>
    </div>
  );
}
