import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/auth";

const DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/teachers",
  "/dashboard/classes",
  "/dashboard/finance",
  "/dashboard/grades",
  "/dashboard/events",
  "/dashboard/announcements",
  "/dashboard/students",
  "/dashboard/attendance",
  "/dashboard/timetable",
  "/dashboard/analytics",
];

test.describe("Dashboard route smoke", () => {
  test.setTimeout(240000);

  test("all dashboard routes render without generic server error", async ({ page }) => {
    await loginAsAdmin(page);

    for (const route of DASHBOARD_ROUTES) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60000 });
      await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, "\\/")}$`));
      await expect(
        page.locator("text=Application error: a server-side exception has occurred"),
      ).toHaveCount(0);
      await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
    }
  });
});
