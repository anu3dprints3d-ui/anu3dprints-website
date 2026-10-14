import { beforeAll, describe, expect, it } from "vitest";

// Simulates what Netlify sends to the function after the /api/* redirect in netlify.toml.
const SITE = "https://example.netlify.app";

function event({ method = "GET", path, body, contentType }) {
  return {
    httpMethod: method,
    // Netlify gives the function's own path in `path`, but the ORIGINAL public URL in `rawUrl`.
    path: "/.netlify/functions/api",
    rawUrl: SITE + path,
    headers: { host: "example.netlify.app", "x-forwarded-for": "203.0.113.7", ...(contentType ? { "content-type": contentType } : {}) },
    multiValueHeaders: {},
    queryStringParameters: null,
    body: body ? Buffer.from(body).toString("base64") : null,
    isBase64Encoded: Boolean(body),
    requestContext: {},
  };
}

function multipart(fields) {
  const boundary = "----testboundary123";
  const body =
    Object.entries(fields)
      .map(([k, v]) => `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`)
      .join("") + `--${boundary}--\r\n`;
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

let handler;
beforeAll(async () => {
  process.env.NETLIFY = "true";
  ({ handler } = await import("./api.js"));
});

describe("Netlify function wrapper", () => {
  it("serves API routes under their original /api path", async () => {
    const res = await handler(event({ path: "/api/health" }), {});
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
  });

  it("also works when Netlify reports the function path in rawUrl", async () => {
    const res = await handler({ ...event({ path: "/api/health" }), rawUrl: SITE + "/.netlify/functions/api/api/health" }, {});
    expect(res.statusCode).toBe(200);
  });

  it("rejects admin actions without a session (401) and unknown actions (404)", async () => {
    const m = multipart({ _args: "[]" });
    const unauth = await handler(event({ method: "POST", path: "/api/actions/saveProduct", ...m }), {});
    expect(unauth.statusCode).toBe(401);
    const unknown = await handler(event({ method: "POST", path: "/api/actions/doesNotExist", ...m }), {});
    expect(unknown.statusCode).toBe(404);
  });

  it("accepts a multipart public enquiry and returns field errors for bad input", async () => {
    const m = multipart({ _args: "[]", _form: "1", type: "custom_print", customer_name: "A", phone: "abc", customization_details: "short", quantity: "1" });
    const res = await handler(event({ method: "POST", path: "/api/actions/submitEnquiry", ...m }), {});
    const json = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(json.ok).toBe(false);
    expect(Object.keys(json.fieldErrors)).toEqual(expect.arrayContaining(["customer_name", "phone", "customization_details"]));
  });

  it("serves robots.txt that hides /admin and /api", async () => {
    const res = await handler(event({ path: "/robots.txt" }), {});
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("Disallow: /admin");
    expect(res.body).toContain(`${SITE}/sitemap.xml`);
  });

  it("caps uploads at 4 MB when running on Netlify (6 MB request limit)", async () => {
    const { MAX_UPLOAD_MB } = await import("../../server/lib/limits.js");
    expect(MAX_UPLOAD_MB).toBe(4);
  });
});
