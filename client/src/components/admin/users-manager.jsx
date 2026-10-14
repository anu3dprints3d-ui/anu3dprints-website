import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "@/lib/nav";
import { toast } from "sonner";
import { inviteAdmin, setUserActive, setUserRole } from "@/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/fields";
import { Badge, Card } from "@/components/ui/misc";
const ROLE_LABELS = { super_admin: "Super Admin", catalogue_manager: "Catalogue Manager", enquiry_manager: "Enquiry Manager" };
export function InviteForm() {
    const router = useRouter();
    const [state, action, pending] = useActionState(inviteAdmin, {});
    useEffect(() => {
        if (!state.message)
            return;
        if (state.ok) {
            toast.success(state.message);
            router.refresh();
        }
        else
            toast.error(state.message);
    }, [state, router]);
    return (<form action={action}>
      <Card className="grid gap-3 p-5 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
        <Field label="Email to invite" htmlFor="email"><Input id="email" name="email" type="email" required/></Field>
        <Field label="Role" htmlFor="role">
          <Select id="role" name="role" defaultValue="catalogue_manager">{Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        </Field>
        <Button type="submit" disabled={pending}>Send invite</Button>
      </Card>
    </form>);
}
export function UserCard({ user, isSelf }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const done = (r) => { if (r.ok) {
        toast.success(r.message);
        router.refresh();
    }
    else
        toast.error(r.message ?? "Failed"); };
    return (<Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="font-semibold">{user.email}{isSelf ? " (you)" : ""}</p>{!user.is_active ? <Badge tone="red">Deactivated</Badge> : null}</div>
        {!isSelf ? <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => done(await setUserActive(user.id, !user.is_active)))}>{user.is_active ? "Deactivate" : "Reactivate"}</Button> : null}
      </div>
      <div className="flex flex-wrap gap-4">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (<label key={role} className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={user.roles.includes(role)} disabled={pending} onChange={(e) => start(async () => done(await setUserRole(user.id, role, e.target.checked)))}/> {label}
          </label>))}
      </div>
    </Card>);
}
