import http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// api/index.js is what Vercel runs: the Express app as a plain (req, res) handler.
let server;
let base;
beforeAll(async () => {
  process.env.VERCEL = "1";
  const { default: handler } = await import("./index.js");
  server = http.createServer(handler);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server?.close());

describe("Vercel function entry (api/index.js)", () => {
  it("serves the API under /api", async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("protects admin actions (401) and exports (403) without a session", async () => {
    const form = new FormData();
    form.set("_args", "[]");
    expect((await fetch(`${base}/api/actions/saveProduct`, { method: "POST", body: form })).status).toBe(401);
    expect((await fetch(`${base}/api/admin/export/enquiries`)).status).toBe(403);
  });

  it("serves robots.txt and applies the serverless 4 MB upload cap", async () => {
    const res = await fetch(`${base}/robots.txt`);
    expect(await res.text()).toContain("Disallow: /admin");
    const { MAX_UPLOAD_MB } = await import("../server/lib/limits.js");
    expect(MAX_UPLOAD_MB).toBe(4);
  });
});
