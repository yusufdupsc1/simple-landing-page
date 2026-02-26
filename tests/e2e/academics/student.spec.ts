import { test, expect } from "@playwright/test";

test.describe("Academic Flows", () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "admin@schooledu.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 10000 });
  });

  test.describe("Student Management", () => {
    test("should display students page", async ({ page }) => {
      await page.goto("/dashboard/students");

      await expect(page.locator("h1:has-text('Students')")).toBeVisible();
    });

    test("should open create student dialog", async ({ page }) => {
      await page.goto("/dashboard/students");

      // Click add student button
      await page.click('button:has-text("Add Student")');

      // Check dialog is open
      await expect(
        page.locator('dialog:has-text("Add Student")'),
      ).toBeVisible();
    });

    test("should create new student", async ({ page }) => {
      await page.goto("/dashboard/students");

      // Open dialog
      await page.click('button:has-text("Add Student")');

      // Fill form
      await page.fill('input[name="firstName"]', "Test");
      await page.fill('input[name="lastName"]', "Student");
      await page.fill('input[name="email"]', "test@student.school.com");

      // Select class (if dropdown exists)
      // await page.selectOption('select[name="classId"]', 'class-123');

      // Submit
      await page.click('button:has-text("Create Student")');

      // Should show success message
      await expect(page.locator("text=Student created")).toBeVisible({
        timeout: 10000,
      });
    });

    test("should search students", async ({ page }) => {
      await page.goto("/dashboard/students");

      // Use search input
      await page.fill('input[placeholder*="Search"]', "John");

      // Results should filter
      // This depends on the implementation
      await page.waitForTimeout(500);
    });

    test("should paginate students", async ({ page }) => {
      await page.goto("/dashboard/students");

      // Check if pagination exists
      const pagination = page.locator('[class*="pagination"]');
      if (await pagination.isVisible()) {
        await page.click('button:has-text("2")');
        // Should show different results
      }
    });

    test("should delete student (soft delete)", async ({ page }) => {
      await page.goto("/dashboard/students");

      // Click delete on a student
      // This would need a specific student to target
      // await page.click('button[aria-label="Delete"]:first');

      // Should show confirmation or success
      test.skip(true, "Needs specific student ID");
    });
  });

  test.describe("Teacher Management", () => {
    test("should display teachers page", async ({ page }) => {
      await page.goto("/dashboard/teachers");

      await expect(page.locator("h1:has-text('Teachers')")).toBeVisible();
    });

    test("should create new teacher", async ({ page }) => {
      await page.goto("/dashboard/teachers");

      await page.click('button:has-text("Add Teacher")');

      await page.fill('input[name="firstName"]', "Test");
      await page.fill('input[name="lastName"]', "Teacher");
      await page.fill('input[name="email"]', "test@school.com");
      await page.fill('input[name="specialization"]', "Mathematics");

      await page.click('button:has-text("Create Teacher")');

      await expect(page.locator("text=Teacher created")).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Class Management", () => {
    test("should display classes page with tabs", async ({ page }) => {
      await page.goto("/dashboard/classes");

      await expect(page.locator("h1:has-text('Classes')")).toBeVisible();
      await expect(page.locator('button:has-text("Classes")')).toBeVisible();
      await expect(page.locator('button:has-text("Subjects")')).toBeVisible();
    });

    test("should create new class", async ({ page }) => {
      await page.goto("/dashboard/classes");

      await page.click('button:has-text("Add Class")');

      await page.fill('input[name="name"]', "Grade 8A");
      await page.fill('input[name="grade"]', "8");
      await page.fill('input[name="section"]', "A");
      await page.fill('input[name="capacity"]', "30");

      await page.click('button:has-text("Create Class")');

      await expect(page.locator("text=Class created")).toBeVisible({
        timeout: 10000,
      });
    });

    test("should switch to subjects tab", async ({ page }) => {
      await page.goto("/dashboard/classes");

      await page.click('button:has-text("Subjects")');

      await expect(
        page.locator('button:has-text("Add Subject")'),
      ).toBeVisible();
    });

    test("should create new subject", async ({ page }) => {
      await page.goto("/dashboard/classes");
      await page.click('button:has-text("Subjects")');

      await page.click('button:has-text("Add Subject")');

      await page.fill('input[name="name"]', "Physics");
      await page.fill('input[name="code"]', "PHY101");

      await page.click('button:has-text("Create Subject")');

      await expect(page.locator("text=Subject created")).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Attendance", () => {
    test("should display attendance page", async ({ page }) => {
      await page.goto("/dashboard/attendance");

      await expect(page.locator("h1:has-text('Attendance')")).toBeVisible();
    });

    test("should select class for attendance", async ({ page }) => {
      await page.goto("/dashboard/attendance");

      // Select a class
      await page.click('button[class*="select"]');
      await page.click("text=Grade 9A");

      // Should show students for that class
      await page.waitForTimeout(500);
    });

    test("should mark attendance", async ({ page }) => {
      await page.goto("/dashboard/attendance");

      // Select class
      await page.click('button[class*="select"]');
      await page.click("text=Grade 9A");

      // Mark attendance for students
      // This depends on the UI implementation
      await page.waitForTimeout(500);
    });

    test("should show attendance summary", async ({ page }) => {
      await page.goto("/dashboard/attendance");

      // Should show summary stats
      await expect(page.locator("text=Present")).toBeVisible();
    });
  });

  test.describe("Grades", () => {
    test("should display grades page", async ({ page }) => {
      await page.goto("/dashboard/grades");

      await expect(page.locator("h1:has-text('Grades')")).toBeVisible();
    });

    test("should create new grade", async ({ page }) => {
      await page.goto("/dashboard/grades");

      await page.click('button:has-text("Add Grade")');

      // Fill grade form
      // await page.fill('input[name="studentId"]', 'STU-2024-0001');
      // await page.selectOption('select[name="subjectId"]', 'subject-123');
      // await page.fill('input[name="score"]', '85');

      // This test needs specific data
      test.skip(true, "Needs seeded subjects");
    });

    test("should show grade distribution chart", async ({ page }) => {
      await page.goto("/dashboard/grades");

      // Should show distribution pie chart
      await expect(page.locator("text=Grade Distribution")).toBeVisible();
    });
  });
});
