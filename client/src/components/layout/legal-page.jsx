export function LegalPage({ title, updated, sections }) {
    return (<div className="container-page max-w-3xl py-10 sm:py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}. This is template text - have it reviewed before relying on it.</p>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (<section key={s.heading}>
            <h2 className="text-xl font-bold">{s.heading}</h2>
            {s.body.map((p) => (<p key={p} className="mt-2 leading-relaxed text-muted-foreground">{p}</p>))}
          </section>))}
      </div>
    </div>);
}
export const ENQUIRY_NOTICE = "This website accepts enquiries only. Orders, pricing, production timelines and delivery arrangements are confirmed directly with Anu3D Prints, usually on WhatsApp. No payments are processed through this website.";
