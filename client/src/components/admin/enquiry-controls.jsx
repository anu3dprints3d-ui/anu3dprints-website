import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { addEnquiryNote, assignEnquiry, setEnquiryStatus } from "@/api";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/fields";
import { ENQUIRY_STATUS_LABELS } from "@shared/constants";
export function StatusSelect({ id, status }) {
    const [pending, start] = useTransition();
    return (<Select aria-label="Enquiry status" defaultValue={status} disabled={pending} onChange={(e) => start(async () => { const r = await setEnquiryStatus(id, e.target.value); if (r.ok)
        toast.success(r.message);
    else
        toast.error(r.message ?? "Failed"); })}>
      {Object.keys(ENQUIRY_STATUS_LABELS).map((s) => <option key={s} value={s}>{ENQUIRY_STATUS_LABELS[s]}</option>)}
    </Select>);
}
export function AssignSelect({ id, assignee, admins }) {
    const [pending, start] = useTransition();
    return (<Select aria-label="Assigned to" defaultValue={assignee ?? ""} disabled={pending} onChange={(e) => start(async () => { const r = await assignEnquiry(id, e.target.value || null); if (r.ok)
        toast.success(r.message);
    else
        toast.error(r.message ?? "Failed"); })}>
      <option value="">Unassigned</option>
      {admins.map((a) => <option key={a.id} value={a.id}>{a.email}</option>)}
    </Select>);
}
export function NoteForm({ enquiryId }) {
    const [state, action, pending] = useActionState(addEnquiryNote, {});
    const ref = useRef(null);
    useEffect(() => {
        if (!state.message)
            return;
        if (state.ok) {
            toast.success(state.message);
            ref.current?.reset();
        }
        else
            toast.error(state.message);
    }, [state]);
    return (<form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="enquiry_id" value={enquiryId}/>
      <Textarea name="body" aria-label="Internal note" placeholder="Add an internal note (never shown to the customer)" required maxLength={4000} className="min-h-24"/>
      <Button type="submit" variant="dark" size="sm" disabled={pending}>Add note</Button>
    </form>);
}
