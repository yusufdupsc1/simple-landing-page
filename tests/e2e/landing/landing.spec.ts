import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test.setTimeout(120000);

  test("renders hero heading and primary CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /অফিসিয়াল ডিজিটাল ল্যান্ডিং অভিজ্ঞতা/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /ডেমো বুকিং দিন/i }).first(),
    ).toBeVisible();
  });

  test("renders module and pricing sections", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", {
        name: /সরকারি প্রাথমিক শিক্ষা প্রশাসনের দায়িত্বভিত্তিক মডিউল/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /বাস্তবায়ন ও সহায়তা পরিকল্পনা/i }),
    ).toBeVisible();
  });
});
