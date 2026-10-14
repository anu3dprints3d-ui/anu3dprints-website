/**
 * In-memory sliding-window limiter. Good enough for a single server/instance and for tests;
 * on serverless (Vercel) each instance has its own memory, so for strict global limits swap
 * `store` for Redis/Upstash. The interface stays the same.
 */
const store = new Map();
export function rateLimit(key, limit, windowMs, now = Date.now()) {
    const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);
    if (hits.length >= limit) {
        store.set(key, hits);
        return { ok: false, retryAfterSeconds: Math.ceil((windowMs - (now - hits[0])) / 1000) };
    }
    hits.push(now);
    store.set(key, hits);
    if (store.size > 5000) {
        for (const [k, v] of store)
            if (v.every((t) => now - t >= windowMs))
                store.delete(k);
    }
    return { ok: true, retryAfterSeconds: 0 };
}
export function resetRateLimits() {
    store.clear();
}
