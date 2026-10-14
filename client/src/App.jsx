import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import PublicLayout from "@/pages/PublicLayout";
import HomePage from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CategoryPage from "@/pages/CategoryPage";
import CustomPrintPage from "@/pages/CustomPrintPage";
import BulkOrdersPage from "@/pages/BulkOrdersPage";
import GalleryPage from "@/pages/GalleryPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import FaqPage from "@/pages/FaqPage";
import { PrivacyPage, RefundPage, ShippingPage, TermsPage } from "@/pages/LegalPages";
import NotFound from "@/pages/NotFound";

const AdminRoutes = lazy(() => import("@/admin/AdminRoutes"));


export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="categories/:slug" element={<CategoryPage />} />
        <Route path="custom-3d-printing" element={<CustomPrintPage />} />
        <Route path="bulk-orders" element={<BulkOrdersPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="privacy-policy" element={<PrivacyPage />} />
        <Route path="terms-and-conditions" element={<TermsPage />} />
        <Route path="shipping-and-delivery" element={<ShippingPage />} />
        <Route path="cancellation-and-refund-policy" element={<RefundPage />} />
      </Route>

      <Route path="admin/*" element={<Suspense fallback={<div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading...</div>}><AdminRoutes /></Suspense>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
