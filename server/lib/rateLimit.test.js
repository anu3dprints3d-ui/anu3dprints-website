import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "./rateLimit.js";
describe("rateLimit", () => {
    beforeEach(resetRateLimits);
    it("blocks after the limit and recovers after the window", () => {
        const t0 = 1_000_000;
        expect(rateLimit("k", 2, 1000, t0).ok).toBe(true);
        expect(rateLimit("k", 2, 1000, t0 + 1).ok).toBe(true);
        const blocked = rateLimit("k", 2, 1000, t0 + 2);
        expect(blocked.ok).toBe(false);
        expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
        expect(rateLimit("k", 2, 1000, t0 + 1500).ok).toBe(true);
    });
    it("keys are independent", () => {
        expect(rateLimit("a", 1, 1000).ok).toBe(true);
        expect(rateLimit("b", 1, 1000).ok).toBe(true);
    });
});
