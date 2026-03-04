import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test.setTimeout(120000);

  test("renders hero heading and primary CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /run your school in one place/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /start free trial|start trial/i }).first(),
    ).toBeVisible();
  });

  test("renders module and pricing sections", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: /core product modules/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /simple school pricing/i }),
    ).toBeVisible();
  });
});
