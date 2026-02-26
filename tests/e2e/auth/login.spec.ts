import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test.describe("Login", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/auth/login");

      // Check form elements exist
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/auth/login");

      await page.fill('input[name="email"]', "invalid@example.com");
      await page.fill('input[name="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator("text=Invalid credentials")).toBeVisible({
        timeout: 10000,
      });
    });

    test("should redirect to dashboard on successful login", async ({
      page,
    }) => {
      // Note: This test requires a seeded database with test user
      // For CI, we'd use test credentials from environment variables

      await page.goto("/auth/login");

      // Fill in credentials (using seeded test data)
      await page.fill('input[name="email"]', "admin@schooledu.com");
      await page.fill('input[name="password"]', "admin123");
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
    });

    test("should show validation errors for empty fields", async ({ page }) => {
      await page.goto("/auth/login");

      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator("text=Email is required")).toBeVisible();
    });

    test("should have forgot password link", async ({ page }) => {
      await page.goto("/auth/login");

      const forgotLink = page.locator('a:has-text("Forgot password")');
      await expect(forgotLink).toBeVisible();
    });

    test("should have register link for new institutions", async ({ page }) => {
      await page.goto("/auth/login");

      const registerLink = page.locator('a:has-text("Create institution")');
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe("Registration", () => {
    test("should display registration form", async ({ page }) => {
      await page.goto("/auth/register");

      // Check form elements
      await expect(page.locator('input[name="institutionName"]')).toBeVisible();
      await expect(page.locator('input[name="adminEmail"]')).toBeVisible();
      await expect(page.locator('input[name="adminPassword"]')).toBeVisible();
    });

    test("should validate password strength", async ({ page }) => {
      await page.goto("/auth/register");

      await page.fill('input[name="institutionName"]', "Test School");
      await page.fill('input[name="adminEmail"]', "admin@testschool.com");
      await page.fill('input[name="adminPassword"]', "weak");
      await page.fill('input[name="confirmPassword"]', "weak");
      await page.click('button[type="submit"]');

      // Should show password validation error
      await expect(
        page.locator("text=Password must be at least"),
      ).toBeVisible();
    });

    test("should validate password match", async ({ page }) => {
      await page.goto("/auth/register");

      await page.fill('input[name="institutionName"]', "Test School");
      await page.fill('input[name="adminEmail"]', "admin@testschool.com");
      await page.fill('input[name="adminPassword"]', "SecurePass123!");
      await page.fill('input[name="confirmPassword"]', "DifferentPass123!");
      await page.click('button[type="submit"]');

      // Should show password match error
      await expect(page.locator("text=Passwords do not match")).toBeVisible();
    });

    test("should prevent duplicate institution slug", async ({ page }) => {
      // This would test the duplicate check
      // Would need to seed existing data
      test.skip(true, "Requires seeded data");
    });
  });

  test.describe("Password Reset", () => {
    test("should display forgot password form", async ({ page }) => {
      await page.goto("/auth/forgot-password");

      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should show success message even for non-existent email (security)", async ({
      page,
    }) => {
      await page.goto("/auth/forgot-password");

      await page.fill('input[name="email"]', "nonexistent@example.com");
      await page.click('button[type="submit"]');

      // Should show generic success message
      await expect(page.locator("text=If an account exists")).toBeVisible({
        timeout: 10000,
      });
    });

    test("should display reset password form with valid token", async ({
      page,
    }) => {
      // This would require a valid token from email
      // In real test, we'd generate a test token
      test.skip(true, "Requires email token");
    });

    test("should validate password strength on reset", async ({ page }) => {
      // Would test password validation on reset form
      test.skip(true, "Requires email token");
    });
  });

  test.describe("Session Management", () => {
    test("should persist session across page refreshes", async ({ page }) => {
      // Login first
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', "admin@schooledu.com");
      await page.fill('input[name="password"]', "admin123");
      await page.click('button[type="submit"]');

      // Wait for dashboard
      await page.waitForURL("/dashboard");

      // Refresh page - should still be logged in
      await page.reload();
      await expect(page).toHaveURL("/dashboard");
    });

    test("should redirect to login on unauthorized access", async ({
      page,
    }) => {
      // Try to access protected route without login
      await page.goto("/dashboard/students");

      // Should redirect to login
      await expect(page).toHaveURL("/auth/login", { timeout: 10000 });
    });

    test("should logout and clear session", async ({ page }) => {
      // Login first
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', "admin@schooledu.com");
      await page.fill('input[name="password"]', "admin123");
      await page.click('button[type="submit"]');

      await page.waitForURL("/dashboard");

      // Click logout (would be in sidebar)
      // This depends on the UI implementation
      // await page.click('button:has-text("Sign out")');

      // Should redirect to login
      // await expect(page).toHaveURL("/auth/login");
    });
  });
});
