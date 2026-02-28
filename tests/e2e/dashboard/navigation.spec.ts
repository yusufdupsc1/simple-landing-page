import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/auth";

test.describe.skip("Dashboard responsive navigation", () => {
  test.setTimeout(180000);

  test("shows primary sidebar nav on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAsAdmin(page);

    await expect(page.getByRole("navigation", { name: /primary/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /mobile primary/i })).toBeHidden();
  });

  test("shows mobile bottom nav on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);

    await expect(page.getByRole("navigation", { name: /mobile primary/i })).toBeVisible();
  });
});
