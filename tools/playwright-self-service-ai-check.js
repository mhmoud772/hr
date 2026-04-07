const { chromium } = require("playwright");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:5173";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 75 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const result = {
    apiFailures: [],
    consoleErrors: [],
    pageErrors: [],
    currentUrl: "",
    tabTexts: [],
    bodySnippet: "",
    screenshot: "C:/Users/SH/AppData/Local/Temp/hrc-self-service-ai-check.png",
  };

  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/api/") && response.status() >= 400) {
      result.apiFailures.push({ url, status: response.status() });
    }
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      result.consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (error) => {
    result.pageErrors.push(String(error));
  });

  try {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle" });
    await page.fill("#username", "admin");
    await page.fill("#password", "admin123");
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });

    await page.goto(`${FRONTEND_URL}/self-service`, { waitUntil: "load" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    result.currentUrl = page.url();
    result.tabTexts = await page.locator('[role="tab"]').allTextContents();
    result.bodySnippet = (await page.locator("body").innerText()).slice(0, 2000);
    await page.screenshot({ path: result.screenshot, fullPage: true });

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    result.error = String(error);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
