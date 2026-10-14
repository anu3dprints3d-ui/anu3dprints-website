import { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export const CATALOGUE_ROLES = ["super_admin", "catalogue_manager"];
export const ENQUIRY_ROLES = ["super_admin", "enquiry_manager"];
export const SUPER_ONLY = ["super_admin"];

export const ROLE_LABELS = { super_admin: "Super Admin", catalogue_manager: "Catalogue Manager", enquiry_manager: "Enquiry Manager" };
export const hasAnyRole = (user, allowed) => !!user && user.roles.some((r) => allowed.includes(r));

const AuthContext = createContext({ loading: true, user: null });

/** Session + roles for the admin area. Roles come from the DB (RLS lets you read only your own); the server re-checks every action. */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let cancelled = false;

    async function load(session) {
      if (!session?.user) return !cancelled && setState({ loading: false, user: null });
      const [{ data: roleRows }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
        supabase.from("profiles").select("full_name,is_active").eq("id", session.user.id).maybeSingle(),
      ]);
      const roles = (roleRows ?? []).map((r) => r.role);
      if (cancelled) return;
      if (!roles.length || profile?.is_active === false) return setState({ loading: false, user: null });
      setState({ loading: false, user: { id: session.user.id, email: session.user.email ?? "", roles } });
    }

    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer: calling Supabase inside this callback can deadlock the auth lock.
      setTimeout(() => load(session), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAdmin = () => useContext(AuthContext);

/** Route guard. UX only - authorisation is enforced by the API and by Postgres RLS. */
export function RequireAdmin({ roles, children }) {
  const { loading, user } = useAdmin();
  if (loading) return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (roles && !hasAnyRole(user, roles)) return <Navigate to="/admin/forbidden" replace />;
  return children;
}
