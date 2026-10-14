import { useEffect } from "react";
import { Navigate, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { Box } from "lucide-react";
import Link from "@/components/Link";
import { ForgotForm, LoginForm, ResetForm } from "@/components/admin/auth-forms";
import { useAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function AuthLayout() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ink p-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-lift sm:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-gold"><Box className="size-5" aria-hidden /></span>
          <span className="font-display text-lg font-extrabold">Anu3D Admin</span>
        </div>
        <Outlet />
      </div>
    </main>
  );
}

export function LoginPage() {
  const { user } = useAdmin();
  const [params] = useSearchParams();
  if (user) return <Navigate to="/admin" replace />;
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Sign in</h1>
      <LoginForm linkError={params.get("error") === "link"} />
    </>
  );
}

export const ForgotPage = () => (
  <>
    <h1 className="mb-4 text-2xl font-bold">Reset password</h1>
    <ForgotForm />
  </>
);

export const ResetPage = () => (
  <>
    <h1 className="mb-4 text-2xl font-bold">Choose a new password</h1>
    <ResetForm />
  </>
);

/** Handles the token_hash links in Supabase invite / password-reset emails. */
export function ConfirmPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => {
    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    const next = params.get("next") ?? "/admin/reset-password";
    const safeNext = next.startsWith("/admin/") ? next : "/admin/reset-password";
    if (!tokenHash || !type) return navigate("/admin/login?error=link", { replace: true });
    supabase.auth.verifyOtp({ type, token_hash: tokenHash }).then(({ error }) => {
      navigate(error ? "/admin/login?error=link" : safeNext, { replace: true });
    });
  }, [params, navigate]);
  return <p className="text-sm text-muted-foreground">Verifying link...</p>;
}

export const ForbiddenPage = () => (
  <>
    <h1 className="text-2xl font-bold">No access</h1>
    <p className="mt-2 text-sm text-muted-foreground">Your role does not allow you to open that page.</p>
    <Link href="/admin" className="mt-5 inline-block text-sm font-semibold underline">Back to dashboard</Link>
  </>
);
