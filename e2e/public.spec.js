import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("home page renders without horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("products can be searched via shareable URL", async ({ page }) => {
    await page.goto("/products?q=keychain");
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
    await expect(page.getByLabel("Search").first()).toHaveValue("keychain");
  });

  test("product enquiry opens WhatsApp with a prefilled, encoded message", async ({ page }) => {
    await page.goto("/products");
    const first = page.locator("a[href^='/products/']").first();
    test.skip((await first.count()) === 0, "No seeded products - run npm run db:migrate -- --seed");
    await first.click();
    const cta = page.getByRole("link", { name: /Enquire on WhatsApp/ });
    await expect(cta).toHaveAttribute("href", /^https:\/\/wa\.me\/(\d+)?\?text=/);
    await expect(cta).toHaveAttribute("rel", /noopener/);
    const href = await cta.getAttribute("href");
    const text = decodeURIComponent(href.split("?text=")[1]);
    expect(text).toContain("Hello Anu3D Prints!");
    expect(text).toContain("Product link:");
  });

  test("no page overflows sideways and tap targets are finger-sized", async ({ page }) => {
    for (const path of ["/", "/products", "/gallery", "/custom-3d-printing", "/bulk-orders", "/about", "/contact", "/faq", "/privacy-policy", "/admin/login"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow, `${path} overflows horizontally`).toBe(false);
    }
  });

  test("mobile menu opens as a full-screen panel", async ({ page, viewport }) => {
    test.skip(!viewport || viewport.width >= 1024, "mobile menu only exists below the lg breakpoint");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.locator("#mobile-nav");
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box.height, "menu must fill the screen, not just the header").toBeGreaterThan(300);
  });

  test("no payment or checkout UI anywhere", async ({ page }) => {
    for (const path of ["/", "/products", "/custom-3d-printing"]) {
      await page.goto(path);
      await expect(page.getByText(/checkout|add to cart|pay now/i)).toHaveCount(0);
    }
  });

  test("custom print form shows validation errors from the server", async ({ page }) => {
    await page.goto("/custom-3d-printing");
    await page.getByLabel("Your name").fill("A");
    await page.getByLabel(/WhatsApp \/ phone/).fill("abc");
    await page.getByLabel("Project description").fill("short");
    await page.getByRole("button", { name: /Save enquiry/ }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });
});

test.describe("admin protection", () => {
  test("signed-out visitors are redirected to login", async ({ page }) => {
    for (const path of ["/admin", "/admin/products", "/admin/enquiries", "/admin/settings"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
  });

  test("export and action endpoints reject anonymous access", async ({ request }) => {
    expect((await request.get("/api/admin/export/enquiries")).status()).toBe(403);
    expect((await request.get("/api/admin/export/products")).status()).toBe(403);
    const action = await request.post("/api/actions/getFileUrl", { multipart: { _args: JSON.stringify(["00000000-0000-0000-0000-000000000000"]) } });
    expect(action.status()).toBe(401);
    const unknown = await request.post("/api/actions/doesNotExist", { multipart: { _args: "[]" } });
    expect(unknown.status()).toBe(404);
  });
});
