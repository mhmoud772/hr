import { expect, test, type Page } from "@playwright/test";

const authUser = {
  id: "1",
  username: "admin",
  name: "Admin",
  role: "admin",
  permissions: ["*"],
};

const assertNoHorizontalPageOverflow = async (page: Page) => {
  const metrics = await page.evaluate(() => ({
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
  }));

  expect(metrics.docScrollWidth - metrics.docClientWidth).toBeLessThanOrEqual(1);
  expect(metrics.bodyScrollWidth - metrics.bodyClientWidth).toBeLessThanOrEqual(1);
};

test.describe("mobile layout review", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      window.localStorage.setItem("authTokenStorage", "local");
      window.localStorage.setItem("authToken", "test-access-token");
      window.localStorage.setItem("refreshToken", "test-refresh-token");
      window.localStorage.setItem("user", JSON.stringify(user));
      window.localStorage.setItem("i18nextLng", "en");
    }, authUser);

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(authUser),
      });
    });

    await page.route("**/api/departments/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "d1", name: "Operations" },
          { id: "d2", name: "Finance" },
        ]),
      });
    });

    await page.route("**/api/job-titles/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 2,
          results: [
            { id: "j1", name: "HR Specialist" },
            { id: "j2", name: "Accountant" },
          ],
        }),
      });
    });

    await page.route("**/api/employees/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 2,
          results: [
            {
              id: "E1001",
              name: "Employee One",
              email: "one@example.com",
              department: "Operations",
              jobTitle: "HR Specialist",
              hireDate: "2024-01-01",
              status: "active",
            },
            {
              id: "E1002",
              name: "Employee Two",
              email: "two@example.com",
              department: "Finance",
              jobTitle: "Accountant",
              hireDate: "2024-02-01",
              status: "leave",
            },
          ],
        }),
      });
    });

    await page.route("**/api/devices/**", async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;

      if (pathname.endsWith("/api/devices/health-report/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            generatedAt: new Date().toISOString(),
            windowDays: 30,
            summary: {
              totalDevices: 2,
              onlineDevices: 1,
              inactiveDevices: 1,
              averageFailureRatePercent: 8,
            },
            devices: [],
          }),
        });
        return;
      }

      if (pathname.endsWith("/api/devices/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            count: 2,
            results: [
              {
                id: "dev-1",
                name: "Front Gate",
                serialNumber: "SN-1001",
                ipAddress: "192.168.1.10",
                location: "HQ",
                status: "online",
                port: 4370,
                employeeCount: 10,
                lastSync: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                lastHeartbeat: new Date().toISOString(),
              },
              {
                id: "dev-2",
                name: "Warehouse Device",
                serialNumber: "SN-1002",
                ipAddress: "192.168.1.11",
                location: "Warehouse",
                status: "offline",
                port: 4370,
                employeeCount: 8,
                lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                lastHeartbeat: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [], count: 0 }),
      });
    });

    await page.route(/\/api\/attendance\/report\/?(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "a1",
            employeeId: "E1001",
            employeeName: "Employee One",
            date: "2026-03-27",
            status: "present",
            checkIn: "08:00",
            checkOut: "17:00",
            workHours: "09:00",
          },
        ]),
      });
    });

  });

  test("employees mobile layout", async ({ page }) => {
    await page.goto("/employees");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText("E1001").first()).toBeVisible();
    await assertNoHorizontalPageOverflow(page);
    await page.screenshot({ path: "test-results/mobile-employees.png", fullPage: true });
  });

  test("devices mobile layout", async ({ page }) => {
    await page.goto("/devices");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText("SN-1001").first()).toBeVisible();
    await assertNoHorizontalPageOverflow(page);
    await page.screenshot({ path: "test-results/mobile-devices.png", fullPage: true });
  });

  test("reports mobile layout", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.locator("main")).toBeVisible();

    await page.getByRole("button", { name: /generate report/i }).click();
    await expect(page.getByText("E1001")).toBeVisible();

    const tabsScrollable = await page
      .locator("[role='tablist']")
      .evaluate((el) => el.scrollWidth > el.clientWidth);

    expect(tabsScrollable).toBe(true);
    await assertNoHorizontalPageOverflow(page);
    await page.screenshot({ path: "test-results/mobile-reports.png", fullPage: true });
  });
});
