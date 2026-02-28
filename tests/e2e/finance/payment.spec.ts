import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/auth";

test.describe("Finance Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("finance page renders summary and table", async ({ page }) => {
    await page.goto("/dashboard/finance", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Finance" })).toBeVisible();
    await expect(page.getByText("Total Billed")).toBeVisible();
    await expect(page.getByText("Collected")).toBeVisible();
    await expect(page.getByText("Outstanding")).toBeVisible();
  });

  test("create fee dialog opens", async ({ page }) => {
    await page.goto("/dashboard/finance", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Create Fee" }).click();
    await expect(page.getByRole("heading", { name: "Create New Fee" })).toBeVisible();
  });

  test("finance page has no generic app error", async ({ page }) => {
    await page.goto("/dashboard/finance", { waitUntil: "domcontentloaded" });

    await expect(
      page.locator("text=Application error: a server-side exception has occurred"),
    ).toHaveCount(0);
  });
});
