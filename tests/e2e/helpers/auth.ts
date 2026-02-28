import { expect, type Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Email address").fill("admin@school.edu");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("**/dashboard", { timeout: 60000 });
  await expect(page).toHaveURL(/\/dashboard$/);
}
