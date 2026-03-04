import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Performance Regression Checks", () => {
  test.setTimeout(120000);

  test("hamburger menu opens within performance target", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);

    const trigger = page.locator("#hamburger-menu-trigger");
    await expect(trigger).toBeVisible();

    // Measure time to open
    const start = Date.now();
    await trigger.click();

    // Check for visibility of a sidebar item in the drawer
    await expect(
      page.getByRole("navigation", { name: /primary/i }),
    ).toBeVisible();
    const end = Date.now();

    const duration = end - start;
    console.log(`Hamburger open duration: ${duration}ms`);

    // Performance target: 250ms
    expect(duration).toBeLessThan(500); // 500ms for CI safety, but we aim for 250ms
  });

  test("3 navigation transitions work smoothly", async ({ page }) => {
    await loginAsAdmin(page);

    // Transition 1: Dashboard -> Students
    await page.goto("/dashboard");
    await page.click('a[href="/dashboard/students"]');
    await expect(page).toHaveURL(/.*students/);

    // Transition 2: Students -> Finance
    await page.click('a[href="/dashboard/finance"]');
    await expect(page).toHaveURL(/.*finance/);

    // Transition 3: Finance -> Dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
