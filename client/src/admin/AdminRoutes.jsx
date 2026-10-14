import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout, { Guard } from "@/admin/AdminLayout";
import { AuthLayout, ConfirmPage, ForbiddenPage, ForgotPage, LoginPage, ResetPage } from "@/admin/AuthPages";
import DashboardPage from "@/admin/DashboardPage";
import { EditProductPage, NewProductPage, ProductsAdminPage } from "@/admin/ProductPages";
import { CategoriesAdminPage, EditCategoryPage, NewCategoryPage } from "@/admin/CategoryPages";
import GalleryAdminPage from "@/admin/GalleryAdminPage";
import { EnquiriesAdminPage, EnquiryDetailPage } from "@/admin/EnquiryPages";
import { ContentAdminPage, SettingsAdminPage, UsersAdminPage } from "@/admin/SiteAdminPages";
import { CATALOGUE_ROLES, ENQUIRY_ROLES, SUPER_ONLY } from "@/lib/auth";

const cat = (el) => <Guard roles={CATALOGUE_ROLES}>{el}</Guard>;
const enq = (el) => <Guard roles={ENQUIRY_ROLES}>{el}</Guard>;
const sup = (el) => <Guard roles={SUPER_ONLY}>{el}</Guard>;

/** Loaded lazily so storefront visitors never download admin code. Mounted at /admin/*. */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPage />} />
        <Route path="reset-password" element={<ResetPage />} />
        <Route path="auth/confirm" element={<ConfirmPage />} />
        <Route path="forbidden" element={<ForbiddenPage />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={cat(<ProductsAdminPage />)} />
        <Route path="products/new" element={cat(<NewProductPage />)} />
        <Route path="products/:id" element={cat(<EditProductPage />)} />
        <Route path="categories" element={cat(<CategoriesAdminPage />)} />
        <Route path="categories/new" element={cat(<NewCategoryPage />)} />
        <Route path="categories/:id" element={cat(<EditCategoryPage />)} />
        <Route path="gallery" element={cat(<GalleryAdminPage />)} />
        <Route path="enquiries" element={enq(<EnquiriesAdminPage />)} />
        <Route path="enquiries/:id" element={enq(<EnquiryDetailPage />)} />
        <Route path="content" element={sup(<ContentAdminPage />)} />
        <Route path="settings" element={sup(<SettingsAdminPage />)} />
        <Route path="users" element={sup(<UsersAdminPage />)} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
