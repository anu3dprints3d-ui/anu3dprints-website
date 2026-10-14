import { useParams, useSearchParams } from "react-router-dom";
import { Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "@/components/Link";
import { downloadExport, getEnquiryDetail, getFileUrl } from "@/api";
import { PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { AssignSelect, NoteForm, StatusSelect } from "@/components/admin/enquiry-controls";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/fields";
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/misc";
import { supabase } from "@/lib/supabase";
import { useData } from "@/lib/useData";
import { formatDate } from "@shared/format";
import { buildWhatsAppUrl } from "@shared/whatsapp";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_TYPE_LABELS } from "@shared/constants";
import NotFound from "@/pages/NotFound";

const PER_PAGE = 25;
const statusTone = (s) => (s === "new" ? "gold" : s === "completed" || s === "confirmed_outside_website" ? "green" : s === "closed" ? "neutral" : "blue");

export function EnquiriesAdminPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const q = (params.get("q") ?? "").replace(/[,()%*\\:"']/g, " ").trim().slice(0, 80);
  const status = params.get("status") in ENQUIRY_STATUS_LABELS ? params.get("status") : "";
  const type = params.get("type") in ENQUIRY_TYPE_LABELS ? params.get("type") : "";

  const { data, loading } = useData(async () => {
    let query = supabase.from("enquiries").select("id,reference,type,status,customer_name,phone,product_name,quantity,created_at", { count: "exact" });
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);
    if (q) query = query.or(`customer_name.ilike.%${q}%,reference.ilike.%${q}%,phone.ilike.%${q}%,company_name.ilike.%${q}%`);
    return query.order("created_at", { ascending: false }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  }, [q, status, type, page]);

  const total = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const go = (n) => {
    const sp = new URLSearchParams(params);
    if (n > 1) sp.set("page", String(n));
    else sp.delete("page");
    setParams(sp);
  };
  const filter = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    for (const [k, v] of new FormData(e.currentTarget).entries()) if (String(v).trim()) next.set(k, String(v).trim());
    setParams(next);
  };

  return (
    <>
      <PageHeader title="Enquiries" description={`${total} enquiry(ies)`} actions={<Button variant="outline" onClick={() => downloadExport("enquiries", { ...(status && { status }), ...(type && { type }) })}><Download className="size-4" aria-hidden /> Export CSV</Button>} />
      <form onSubmit={filter} key={params.toString()} className="mb-4 grid gap-2 sm:grid-cols-[1fr_12rem_12rem_auto]" role="search">
        <Input name="q" defaultValue={q} placeholder="Name, phone, reference or company" aria-label="Search enquiries" />
        <Select name="status" defaultValue={status} aria-label="Status"><option value="">All statuses</option>{Object.entries(ENQUIRY_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        <Select name="type" defaultValue={type} aria-label="Type"><option value="">All types</option>{Object.entries(ENQUIRY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        <Button type="submit" variant="dark">Filter</Button>
      </form>
      {loading ? <Skeleton className="h-64" /> : data.error ? <EmptyState title="Could not load enquiries" /> : !data.data?.length ? <EmptyState title="No enquiries found" body="New enquiries from the website will appear here." /> : (
        <Table>
          <thead><tr><Th>Ref</Th><Th>Customer</Th><Th>Type</Th><Th>About</Th><Th>Status</Th><Th>Received</Th></tr></thead>
          <tbody>
            {data.data.map((e) => (
              <tr key={e.id} className="hover:bg-muted/40">
                <Td><Link href={`/admin/enquiries/${e.id}`} className="font-semibold hover:underline">{e.reference}</Link></Td>
                <Td><p className="font-medium">{e.customer_name}</p><p className="text-xs text-muted-foreground">{e.phone}</p></Td>
                <Td label="Type">{ENQUIRY_TYPE_LABELS[e.type]}</Td>
                <Td label="About" className="sm:max-w-48 sm:truncate">{e.product_name ?? "-"}{e.quantity ? ` x${e.quantity}` : ""}</Td>
                <Td label="Status"><Badge tone={statusTone(e.status)}>{ENQUIRY_STATUS_LABELS[e.status]}</Badge></Td>
                <Td label="Received" className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(e.created_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? <Button size="sm" variant="outline" onClick={() => go(page - 1)}>Previous</Button> : null}
          <span>Page {page} of {pages}</span>
          {page < pages ? <Button size="sm" variant="outline" onClick={() => go(page + 1)}>Next</Button> : null}
        </nav>
      ) : null}
    </>
  );
}

function Row({ label, value }) {
  if (value == null || value === "") return null;
  return <div className="grid grid-cols-3 gap-3 py-2 text-sm"><dt className="font-medium text-muted-foreground">{label}</dt><dd className="col-span-2 whitespace-pre-line break-words">{value}</dd></div>;
}

async function openFile(id) {
  const res = await getFileUrl(id);
  if (res.ok) window.open(res.url, "_blank", "noopener,noreferrer");
  else toast.error(res.message ?? "Could not open the file");
}

export function EnquiryDetailPage() {
  const { id } = useParams();
  const { data, loading } = useData(() => getEnquiryDetail(id), [id]);
  if (loading) return <Skeleton className="h-64" />;
  if (!data?.ok) return data?.message === "Enquiry not found." || data?.message === "Invalid enquiry." ? <NotFound inline /> : <EmptyState title="Could not load this enquiry" body={data?.message} />;

  const { enquiry: e, files, notes, history, admins, emails } = data;
  const waUrl = buildWhatsAppUrl(e.phone, `Hello ${e.customer_name}, this is Anu3D Prints regarding your enquiry ${e.reference}.`);

  return (
    <>
      <PageHeader
        title={`${e.reference} - ${e.customer_name}`}
        description={`${ENQUIRY_TYPE_LABELS[e.type]} - received ${formatDate(e.created_at)}`}
        actions={<a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-whatsapp px-5 text-sm font-semibold text-white"><MessageCircle className="size-4" aria-hidden /> WhatsApp customer</a>}
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* On phones both columns dissolve (contents) so cards can be ordered: Status first, Timeline last. */}
        <div className="contents lg:block lg:space-y-6">
          <Card className="order-2 p-5 lg:order-none">
            <h2 className="mb-2 text-lg font-bold">Details</h2>
            <dl className="divide-y divide-border">
              <Row label="Phone" value={e.phone} /><Row label="Email" value={e.email} /><Row label="Company" value={e.company_name} />
              <Row label="Product" value={e.product_name} /><Row label="Quantity" value={e.quantity} /><Row label="Material" value={e.material} />
              <Row label="Size" value={e.size_preference} /><Row label="Required by" value={e.required_by} />
              <Row label="Customisation" value={e.customization_details} /><Row label="Message" value={e.message} />
            </dl>
          </Card>
          {files.length ? (
            <Card className="order-3 p-5 lg:order-none">
              <h2 className="mb-2 text-lg font-bold">Customer files (private)</h2>
              <ul className="space-y-2 text-sm">
                {files.map((f) => (
                  <li key={f.id}>
                    <button type="button" className="inline-flex items-center gap-2 font-medium underline" onClick={() => openFile(f.id)}><Download className="size-4" aria-hidden /> {f.original_name}</button>{" "}
                    <span className="text-xs text-muted-foreground">({Math.round(f.size_bytes / 1024)} KB)</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Links are checked against your role and expire after 5 minutes.</p>
            </Card>
          ) : null}
          <Card className="order-4 p-5 lg:order-none">
            <h2 className="mb-3 text-lg font-bold">Internal notes</h2>
            <NoteForm enquiryId={e.id} />
            <ul className="mt-4 space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl bg-muted/60 p-3 text-sm"><p className="whitespace-pre-line">{n.body}</p><p className="mt-1 text-xs text-muted-foreground">{emails[n.author_id] ?? "Admin"} - {formatDate(n.created_at)}</p></li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="contents lg:block lg:space-y-6">
          <Card className="order-1 space-y-3 p-5 lg:order-none">
            <h2 className="text-lg font-bold">Status</h2>
            <StatusSelect id={e.id} status={e.status} />
            <h3 className="pt-2 text-sm font-semibold">Assigned to</h3>
            <AssignSelect id={e.id} assignee={e.assigned_to} admins={admins} />
          </Card>
          <Card className="order-5 p-5 lg:order-none">
            <h2 className="mb-3 text-lg font-bold">Timeline</h2>
            <ol className="space-y-3 border-l-2 border-border pl-4">
              {history.map((h) => (
                <li key={h.id} className="relative text-sm">
                  <span className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-gold-deep" aria-hidden />
                  <Badge>{ENQUIRY_STATUS_LABELS[h.to_status]}</Badge>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(h.created_at)}{h.changed_by ? ` - ${emails[h.changed_by] ?? "Admin"}` : " - customer submitted"}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
