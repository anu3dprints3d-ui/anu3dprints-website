import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, bulkOrderMessage, customPrintMessage, normalizeWhatsAppNumber, productEnquiryMessage, } from "./whatsapp.js";
describe("normalizeWhatsAppNumber", () => {
    it("strips formatting", () => expect(normalizeWhatsAppNumber("+91 98765-43210")).toBe("919876543210"));
    it("rejects too-short values", () => expect(normalizeWhatsAppNumber("12345")).toBe(""));
    it("handles null", () => expect(normalizeWhatsAppNumber(null)).toBe(""));
});
describe("buildWhatsAppUrl", () => {
    it("encodes the message with encodeURIComponent", () => {
        const url = buildWhatsAppUrl("919876543210", "Hi & bye\nline 2 ₹99");
        expect(url).toBe(`https://wa.me/919876543210?text=${encodeURIComponent("Hi & bye\nline 2 ₹99")}`);
        expect(url).not.toContain(" ");
    });
    it("falls back to the default business number when unconfigured", () => {
        expect(buildWhatsAppUrl("", "hi")).toBe("https://wa.me/918939326710?text=hi");
    });
});
describe("messages", () => {
    it("product message has name, sku, price and link", () => {
        const m = productEnquiryMessage({ name: "Photo Lamp", sku: "A3D-0003", price: 899, url: "https://x.test/products/photo-lamp" });
        expect(m).toContain("Product: Photo Lamp");
        expect(m).toContain("SKU: A3D-0003");
        expect(m).toContain("Price shown: ₹899");
        expect(m).toContain("Product link: https://x.test/products/photo-lamp");
    });
    it("custom print message includes reference and details", () => {
        const m = customPrintMessage({ reference: "A3D-1001", customerName: "Asha", description: "Gear", quantity: 3, material: "PLA", requiredBy: "2026-12-01" });
        expect(m).toContain("Enquiry ref: A3D-1001");
        expect(m).toContain("Quantity: 3");
        expect(m).toContain("Required by: 2026-12-01");
    });
    it("bulk message includes company and quantity", () => {
        const m = bulkOrderMessage({ reference: "A3D-1002", company: "Acme", item: "Keychains", quantity: 100, branding: "Logo" });
        expect(m).toContain("Company/Organisation: Acme");
        expect(m).toContain("Quantity: 100");
    });
});
