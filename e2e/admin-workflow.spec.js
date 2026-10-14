import { expect, test } from "@playwright/test";

// Full admin workflow. Needs a real admin account:
//   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (a Super Admin on a NON-production project)
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin workflow tests");

test("admin creates category + product, product appears publicly, enquiry is managed", async ({ page }) => {
  const stamp = Date.now().toString(36);
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // category
  await page.goto("/admin/categories/new");
  await page.getByLabel("Name").fill(`E2E Cat ${stamp}`);
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByText(`E2E Cat ${stamp}`)).toBeVisible();

  // product (published)
  await page.goto("/admin/products/new");
  await page.getByLabel("Product name").fill(`E2E Product ${stamp}`);
  await page.getByLabel("Price (₹)").fill("123");
  await page.getByLabel("Published").check();
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}$/);

  // public site
  await page.goto(`/products?q=E2E Product ${stamp}`);
  await expect(page.getByText(`E2E Product ${stamp}`).first()).toBeVisible();

  // enquiry
  await page.goto("/custom-3d-printing");
  await page.getByLabel("Your name").fill("E2E Tester");
  await page.getByLabel(/WhatsApp \/ phone/).fill("9876543210");
  await page.getByLabel("Project description").fill(`E2E enquiry ${stamp} - bracket`);
  await page.getByRole("button", { name: /Save enquiry/ }).click();
  await expect(page.getByText(/Enquiry A3D-\d+ saved/)).toBeVisible();

  await page.goto("/admin/enquiries?q=E2E Tester");
  await page.getByRole("link", { name: /A3D-\d+/ }).first().click();
  await page.getByLabel("Enquiry status").selectOption("contacted");
  await page.getByLabel("Internal note").fill("Called customer");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Called customer")).toBeVisible();
});
