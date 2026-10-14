import { Outlet } from "react-router-dom";
import { AdminShell } from "@/components/admin/admin-shell";
import { CATALOGUE_ROLES, ENQUIRY_ROLES, ROLE_LABELS, SUPER_ONLY, RequireAdmin, hasAnyRole, useAdmin } from "@/lib/auth";

function Shell() {
  const { user } = useAdmin();
  const nav = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    ...(hasAnyRole(user, CATALOGUE_ROLES)
      ? [
          { href: "/admin/products", label: "Products", icon: "products" },
          { href: "/admin/categories", label: "Categories", icon: "categories" },
          { href: "/admin/gallery", label: "Gallery", icon: "gallery" },
        ]
      : []),
    ...(hasAnyRole(user, ENQUIRY_ROLES) ? [{ href: "/admin/enquiries", label: "Enquiries", icon: "enquiries" }] : []),
    ...(hasAnyRole(user, SUPER_ONLY)
      ? [
          { href: "/admin/content", label: "Homepage content", icon: "content" },
          { href: "/admin/settings", label: "Settings", icon: "settings" },
          { href: "/admin/users", label: "Admin users", icon: "users" },
        ]
      : []),
  ];
  return (
    <AdminShell nav={nav} user={{ email: user.email, roleLabels: user.roles.map((r) => ROLE_LABELS[r]) }}>
      <Outlet />
    </AdminShell>
  );
}

export default function AdminLayout() {
  return (
    <RequireAdmin>
      <Shell />
    </RequireAdmin>
  );
}

/** Wraps a page so it only renders for the given roles (UX only; the API and RLS enforce it). */
export function Guard({ roles, children }) {
  return <RequireAdmin roles={roles}>{children}</RequireAdmin>;
}
