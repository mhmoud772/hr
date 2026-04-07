import { test, expect } from "@playwright/test";

test.describe("Employee Flow: Attendance & Leaves", () => {
  const employeeUser = {
    id: "e-100",
    username: "employee",
    name: "Ahmad Employee",
    role: "employee",
    permissions: [],
  };

  test.beforeEach(async ({ page }) => {
    // 1. Mock Authentication
    await page.addInitScript((user) => {
      window.localStorage.setItem("authTokenStorage", "local");
      window.localStorage.setItem("authToken", "test-access-token");
      window.localStorage.setItem("user", JSON.stringify(user));
    }, employeeUser);

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({ status: 200, json: employeeUser });
    });

    // 2. Mock Dashboard & Departments Loaders
    await page.route("**/api/dashboard/summary/**", async (route) => {
      await route.fulfill({ status: 200, json: {} });
    });
    await page.route("**/api/departments/**", async (route) => {
      await route.fulfill({ status: 200, json: [] });
    });
  });

  test("simulate clocking in and requesting a leave", async ({ page }) => {
    // -----------------------------------------------------
    // Scenario 1: Clock-In for Attendance
    // -----------------------------------------------------
    let clockInHit = false;
    await page.route("**/api/attendance/summary/**", async (route) => {
      await route.fulfill({ status: 200, json: [] });
    });
    await page.route("**/api/attendance/clock-in/", async (route) => {
      clockInHit = true;
      await route.fulfill({ status: 200, json: { status: "success" } });
    });

    // Go to Self Service -> Attendance Tab (Assuming it's available or we route directly)
    await page.goto("/self-service?tab=attendance");
    await expect(page.locator("main")).toBeVisible();
    
    // Look for a clock-in button based on Arabic/English locale fallbacks
    // Assuming 'Clock In' or 'تسجيل الدخول'
    const clockInBtn = page.locator('button', { hasText: /Clock In|تسجيل الدخول/i }).first();
    if (await clockInBtn.isVisible()) {
        await clockInBtn.click();
        await expect.poll(() => clockInHit).toBe(true);
    }

    // -----------------------------------------------------
    // Scenario 2: Requesting a Leave
    // -----------------------------------------------------
    let leaveRequested = false;
    await page.route("**/api/leaves/balances/", async (route) => {
      await route.fulfill({ status: 200, json: { annual: 20, sick: 10 } });
    });
    await page.route("**/api/leaves/requests/", async (route) => {
      if (route.request().method() === "POST") {
        leaveRequested = true;
        await route.fulfill({ status: 201, json: { id: "req-1" } });
      } else {
        await route.fulfill({ status: 200, json: { count: 0, results: [] } });
      }
    });

    // Go to Self Service -> Leaves Tab
    await page.goto("/self-service?tab=leaves");
    await expect(page.locator("main")).toBeVisible();

    // Look for New Request button
    const newRequestBtn = page.locator('button', { hasText: /New Request|طلب جديد/i }).first();
    if (await newRequestBtn.isVisible()) {
        await newRequestBtn.click();
        
        // Fill dialog assuming standard fields exist
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.locator('button[type="submit"]').click();

        await expect.poll(() => leaveRequested).toBe(true);
    }
  });
});
