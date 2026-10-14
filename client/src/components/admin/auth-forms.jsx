import Link from "@/components/Link";
import { useActionState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { requestPasswordReset, signIn, updatePassword } from "@/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/fields";
function Message({ state }) {
    if (!state.message)
        return null;
    return (<p role={state.ok ? "status" : "alert"} className={state.ok ? "rounded-xl bg-green-50 p-3 text-sm text-success" : "rounded-xl bg-red-50 p-3 text-sm font-medium text-danger"}>
      {state.message}
    </p>);
}
export function LoginForm({ linkError }) {
    const [state, action, pending] = useActionState(signIn, {});
    const navigate = useNavigate();
    useEffect(() => {
        if (state.ok)
            navigate("/admin", { replace: true });
    }, [state, navigate]);
    return (<form action={action} className="space-y-4">
      {linkError ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-danger">That link is invalid or has expired.</p> : null}
      <Message state={state}/>
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="username" required/></Field>
      <Field label="Password" htmlFor="password"><Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8}/></Field>
      <Button type="submit" variant="dark" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden/> : null} Sign in
      </Button>
      <Link href="/admin/forgot-password" className="block py-3 text-center text-sm text-muted-foreground underline">Forgot password?</Link>
    </form>);
}
export function ForgotForm() {
    const [state, action, pending] = useActionState(requestPasswordReset, {});
    return (<form action={action} className="space-y-4">
      <Message state={state}/>
      <Field label="Admin email" htmlFor="email"><Input id="email" name="email" type="email" required/></Field>
      <Button type="submit" variant="dark" className="w-full" disabled={pending}>Send reset link</Button>
      <Link href="/admin/login" className="block py-3 text-center text-sm text-muted-foreground underline">Back to sign in</Link>
    </form>);
}
export function ResetForm() {
    const [state, action, pending] = useActionState(updatePassword, {});
    const navigate = useNavigate();
    useEffect(() => {
        if (state.ok)
            navigate("/admin", { replace: true });
    }, [state, navigate]);
    return (<form action={action} className="space-y-4">
      <Message state={state}/>
      <Field label="New password" htmlFor="password" hint="At least 12 characters"><Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12}/></Field>
      <Field label="Confirm password" htmlFor="confirm"><Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12}/></Field>
      <Button type="submit" variant="dark" className="w-full" disabled={pending}>Set password</Button>
    </form>);
}
