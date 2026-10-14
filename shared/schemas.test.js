import { describe, expect, it } from "vitest";
import { bulkEnquirySchema, customPrintEnquirySchema, productSchema } from "./schemas.js";
describe("customPrintEnquirySchema", () => {
    const base = { type: "custom_print", customer_name: "Asha", phone: "+91 98765 43210", customization_details: "A bracket for my drone", quantity: "2" };
    it("accepts a valid request and normalises the phone", () => {
        const r = customPrintEnquirySchema.parse(base);
        expect(r.phone).toBe("+919876543210");
        expect(r.quantity).toBe(2);
    });
    it("rejects a bad phone", () => {
        expect(customPrintEnquirySchema.safeParse({ ...base, phone: "abc" }).success).toBe(false);
    });
    it("rejects a filled honeypot", () => {
        expect(customPrintEnquirySchema.safeParse({ ...base, website: "http://spam" }).success).toBe(false);
    });
    it("treats empty optional fields as undefined", () => {
        const r = customPrintEnquirySchema.parse({ ...base, email: "", required_by: "" });
        expect(r.email).toBeUndefined();
        expect(r.required_by).toBeUndefined();
    });
});
describe("bulkEnquirySchema", () => {
    it("requires at least 10 pieces", () => {
        const r = bulkEnquirySchema.safeParse({ type: "bulk_order", customer_name: "Ravi", company_name: "Acme", phone: "9876543210", product_name: "Keychains", quantity: 5 });
        expect(r.success).toBe(false);
    });
});
describe("productSchema", () => {
    const base = { name: "Lamp", slug: "lamp", price: "100" };
    it("rejects negative prices", () => expect(productSchema.safeParse({ ...base, price: -1 }).success).toBe(false));
    it("rejects invalid slugs", () => expect(productSchema.safeParse({ ...base, slug: "Bad Slug" }).success).toBe(false));
    it("rejects sale price above price", () => expect(productSchema.safeParse({ ...base, sale_price: "150" }).success).toBe(false));
    it("parses comma separated option lists", () => {
        const r = productSchema.parse({ ...base, color_options: "Red, Blue ,," });
        expect(r.color_options).toEqual(["Red", "Blue"]);
    });
});
