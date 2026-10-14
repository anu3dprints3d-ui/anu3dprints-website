import { CatalogueView } from "@/components/products/catalogue-view";
import { useSeo } from "@/lib/seo";

export default function ProductsPage() {
  useSeo({ title: "Products", description: "Browse custom 3D printed gifts, keychains, photo lamps, toys, desk accessories and prototypes.", path: "/products" });
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">All Products</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Every item is made to order in Coimbatore. Tap a product to enquire on WhatsApp.</p>
      <CatalogueView basePath="/products" />
    </div>
  );
}
