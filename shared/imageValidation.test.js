import { describe, expect, it } from "vitest";
import { checkImage, MAX_IMAGE_BYTES, sniffImageType } from "./imageValidation.js";
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
describe("image validation", () => {
    it("detects types from magic bytes", () => {
        expect(sniffImageType(png)).toBe("image/png");
        expect(sniffImageType(jpg)).toBe("image/jpeg");
        expect(sniffImageType(html)).toBeNull();
    });
    it("rejects HTML renamed to .png", () => {
        expect(checkImage("evil.png", "image/png", html).ok).toBe(false);
    });
    it("rejects extension/content mismatch", () => {
        expect(checkImage("a.jpg", "image/png", png).ok).toBe(false);
    });
    it("accepts a consistent image", () => {
        expect(checkImage("a.png", "image/png", png)).toEqual({ ok: true, type: "image/png" });
    });
    it("rejects oversize and empty files", () => {
        expect(checkImage("a.png", "image/png", new Uint8Array(MAX_IMAGE_BYTES + 1)).ok).toBe(false);
        expect(checkImage("a.png", "image/png", new Uint8Array(0)).ok).toBe(false);
    });
});
