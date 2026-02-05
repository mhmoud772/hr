import { test, expect } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("form")).toBeVisible();
  await expect(page.locator("h1, h2, h3").first()).toBeVisible();
});

test.describe("authenticated pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      window.localStorage.setItem("user", JSON.stringify(user));
    }, { id: "1", name: "Admin", role: "admin" });
  });

  const routes: { path: string; requireHeading: boolean }[] = [
    { path: "/", requireHeading: false },
    { path: "/employees", requireHeading: false },
    { path: "/attendance", requireHeading: true },
    { path: "/leaves", requireHeading: true },
    { path: "/structure", requireHeading: true },
    { path: "/devices", requireHeading: false },
    { path: "/job-titles", requireHeading: true },
    { path: "/users", requireHeading: true },
    { path: "/settings", requireHeading: true },
  ];

  for (const route of routes) {
    test(`page renders: ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator("main")).toBeVisible();
      if (route.requireHeading) {
        await expect(page.locator("h1, h2, h3").first()).toBeVisible();
      }
    });
  }
});
