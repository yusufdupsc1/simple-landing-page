import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to login...");
  await page.goto("http://localhost:3000/auth/login", {
    waitUntil: "networkidle",
  });

  await page.waitForTimeout(2000); // Wait for React hydration
  await page.fill('input[type="email"]', "admin@school.edu");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');

  console.log("Waiting for dashboard...");
  await page.waitForTimeout(15000);
  await page.waitForURL("**/dashboard**", { timeout: 10000 }).catch(() => {});

  const cookies = await context.cookies();
  const sessionCookie = cookies.find((c) => c.name.includes("session-token"));

  if (sessionCookie) {
    console.log(`COOKIE_FOUND:${sessionCookie.name}=${sessionCookie.value}`);
  } else {
    console.log("COOKIE_NOT_FOUND");
    await page.screenshot({ path: "login-error.png" });
    console.log("Screenshot saved to login-error.png");
    console.log(cookies.map((c) => c.name).join(", "));
  }

  await browser.close();
})();
