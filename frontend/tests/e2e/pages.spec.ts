import { test, expect } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("form")).toBeVisible();
  await expect(page.locator("h1, h2, h3").first()).toBeVisible();
});

test.describe("authenticated pages", () => {
  const authUser = {
    id: "1",
    username: "admin",
    name: "Admin",
    role: "admin",
    permissions: ["*"],
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      window.localStorage.setItem("authTokenStorage", "local");
      window.localStorage.setItem("authToken", "test-access-token");
      window.localStorage.setItem("refreshToken", "test-refresh-token");
      window.localStorage.setItem("user", JSON.stringify(user));
    }, authUser);

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(authUser),
      });
    });
  });

  const routes = [
    "/",
    "/employees",
    "/attendance",
    "/leaves",
    "/structure",
    "/devices",
    "/device-command-center",
    "/job-titles",
    "/users",
    "/settings",
  ];

  for (const route of routes) {
    test(`page renders: ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).not.toHaveURL(/\/login$/);
      await expect(page).not.toHaveURL(/\/not-authorized$/);
      await expect(page.locator("main")).toBeVisible();
    });
  }

  test("devices selection opens command center and queues command", async ({ page }) => {
    let queuedPayload: Record<string, unknown> | null = null;

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
              totalDevices: 1,
              onlineDevices: 1,
              inactiveDevices: 0,
              averageFailureRatePercent: 0,
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
            count: 1,
            results: [
              {
                id: "d1",
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
            ],
          }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });

    await page.route("**/api/device-command-center/**", async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;
      if (pathname.endsWith("/api/device-command-center/catalog/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            commands: [
              { code: "sync", sensitive: false },
              { code: "pull_logs", sensitive: false },
            ],
          }),
        });
        return;
      }
      if (pathname.endsWith("/api/device-command-center/dashboard/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            generatedAt: new Date().toISOString(),
            summary: {
              totalDevices: 1,
              onlineDevices: 1,
              offlineDevices: 0,
              primaryEnrollmentDevices: 0,
              groups: 0,
              policies: 0,
              pendingApprovals: 0,
              runningRollouts: 0,
              activeTemplates: 0,
              templateDistributionsLast7Days: 0,
              commandsLast7Days: 0,
              failedCommandsLast7Days: 0,
            },
            highRiskDevices: [],
            recentCommands: [],
            pendingApprovals: [],
          }),
        });
        return;
      }
      if (pathname.endsWith("/api/device-command-center/queue/")) {
        queuedPayload = JSON.parse(route.request().postData() || "{}");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "ok",
            command: "sync",
            requested: 1,
            queued: 1,
            failed: 0,
            results: [],
          }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });

    await page.route("**/api/device-groups/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [], count: 0 }) });
    });
    await page.route("**/api/device-policies/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [], count: 0 }) });
    });
    await page.route("**/api/device-command-approvals/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [], count: 0 }) });
    });
    await page.route("**/api/device-templates/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [], count: 0 }) });
    });
    await page.route("**/api/device-firmware-rollouts/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [], count: 0 }) });
    });
    await page.route("**/api/device-backups/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [], count: 0 }) });
    });

    await page.goto("/devices");
    await expect(page.locator("main")).toBeVisible();
    await page.locator("tbody [role='checkbox']").first().click();
    await page.getByRole("button", { name: /command center/i }).first().click();

    await expect(page).toHaveURL(/\/device-command-center\?deviceIds=d1/);
    await page.getByRole("tab", { name: /command center/i }).click();
    await expect(page.getByRole("button", { name: /queue command/i })).toBeVisible();
    await page.getByRole("button", { name: /queue command/i }).click();

    await expect.poll(() => (queuedPayload?.deviceIds as string[] | undefined)?.[0] || "").toBe("d1");
    await expect.poll(() => String(queuedPayload?.command || "")).toBe("sync");
  });

  test("reports page generates attendance report", async ({ page }) => {
    let reportRequested = false;

    await page.route("**/api/departments/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/job-titles/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 0, results: [] }),
      });
    });

    await page.route(/\/api\/attendance\/report\/?(\?.*)?$/, async (route) => {
      reportRequested = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "a1",
            employeeId: "E1001",
            employeeName: "Test Employee",
            date: "2026-03-27",
            status: "present",
            checkIn: "08:00",
            checkOut: "17:00",
            workHours: "09:00",
          },
        ]),
      });
    });

    await page.goto("/reports");
    await page.getByRole("button", { name: /generate report/i }).click();

    await expect.poll(() => reportRequested).toBe(true);
    await expect(page.getByText("E1001")).toBeVisible();
    await expect(page.getByRole("button", { name: /export csv/i }).first()).toBeEnabled();
  });
});

test.describe("authorization", () => {
  const employeeUser = {
    id: "2",
    username: "employee",
    name: "Employee",
    role: "employee",
    permissions: [],
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      window.localStorage.setItem("authTokenStorage", "local");
      window.localStorage.setItem("authToken", "test-access-token");
      window.localStorage.setItem("refreshToken", "test-refresh-token");
      window.localStorage.setItem("user", JSON.stringify(user));
    }, employeeUser);

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(employeeUser),
      });
    });
  });

  test("employee is redirected from users page", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/\/not-authorized$/);
  });
});
