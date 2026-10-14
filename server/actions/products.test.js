import { describe, expect, it } from "vitest";
import { archiveProduct } from "./products.js";

/** Minimal stand-in for the Supabase query builder: records update patches, returns a stored row. */
function fakeCtx(row) {
  const calls = { patches: [] };
  const builder = (table) => ({
    update(patch) {
      calls.patches.push({ table, patch });
      Object.assign(row, patch);
      return { eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: { is_published: row.is_published }, error: null }) }) }) };
    },
    insert: async () => ({ error: null }), // admin_activity_logs
  });
  return { calls, ctx: { user: { id: "u1", roles: ["super_admin"] }, supabase: { from: builder } } };
}

describe("archiveProduct", () => {
  it("archiving does NOT unpublish the product, so restoring brings it back as it was", async () => {
    const row = { is_published: true, archived_at: null };
    const { ctx, calls } = fakeCtx(row);

    const archived = await archiveProduct(ctx, "p1", true);
    expect(archived.ok).toBe(true);
    expect(calls.patches[0].patch).not.toHaveProperty("is_published");
    expect(row.archived_at).toBeTruthy();

    const restored = await archiveProduct(ctx, "p1", false);
    expect(restored.ok).toBe(true);
    expect(row.archived_at).toBeNull();
    expect(row.is_published).toBe(true); // visible on the site again
    expect(restored.message).toMatch(/live on the site/i);
  });

  it("restoring a draft keeps it a draft unless 'publish' is requested", async () => {
    const row = { is_published: false, archived_at: "2026-10-01T00:00:00Z" };
    const { ctx } = fakeCtx(row);
    const res = await archiveProduct(ctx, "p1", false);
    expect(row.is_published).toBe(false);
    expect(res.message).toMatch(/draft/i);
  });

  it("'Restore & publish' makes an already-hidden (legacy) archived product live", async () => {
    const row = { is_published: false, archived_at: "2026-10-01T00:00:00Z" };
    const { ctx } = fakeCtx(row);
    const res = await archiveProduct(ctx, "p1", false, true);
    expect(row.archived_at).toBeNull();
    expect(row.is_published).toBe(true);
    expect(res.message).toMatch(/live on the site/i);
  });

  it("rejects callers without a catalogue role", async () => {
    const { ctx } = fakeCtx({});
    ctx.user.roles = ["enquiry_manager"];
    const res = await archiveProduct(ctx, "p1", true);
    expect(res.ok).toBe(false);
  });
});
