const { chromium } = require("playwright");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:5173";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 75 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const result = {
    visited: [],
    apiFailures: [],
    consoleErrors: [],
    pageErrors: [],
    hrChecks: {},
    screenshots: {},
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
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "load" });
    await page.fill("#username", "admin");
    await page.fill("#password", "admin123");
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
    await page.waitForLoadState("networkidle");

    const routes = [
      ["/", "dashboard"],
      ["/employees", "employees"],
      ["/attendance", "attendance"],
      ["/leaves", "leaves"],
      ["/devices", "devices"],
      ["/reports", "reports"],
      ["/self-service", "self-service"],
      ["/settings", "settings"],
    ];

    for (const [route, name] of routes) {
      await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: "load" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(500);
      result.visited.push(route);
      const screenshotPath = `C:/Users/SH/AppData/Local/Temp/hrc-${name}-practical.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshots[name] = screenshotPath;
    }

    await page.goto(`${FRONTEND_URL}/`, { waitUntil: "load" });
    await page.waitForSelector('[data-testid="ai-summary-content"]', { timeout: 30000 });
    result.hrChecks.dashboardSummary = await page
      .locator('[data-testid="ai-summary-content"]')
      .innerText();

    await page.goto(`${FRONTEND_URL}/employees`, { waitUntil: "load" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(500);
    result.hrChecks.employeesBody = (await page.locator("body").innerText()).slice(0, 1200);

    await page.goto(`${FRONTEND_URL}/leaves`, { waitUntil: "load" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(500);
    result.hrChecks.leavesBody = (await page.locator("body").innerText()).slice(0, 1200);

    try {
      await page.goto(`${FRONTEND_URL}/self-service`, { waitUntil: "load" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      const aiTab = page
        .locator('[role="tab"]')
        .filter({ hasText: /AI Assistant|المساعد الذكي|مساعد الذكاء الاصطناعي/i })
        .first();
      if ((await aiTab.count()) > 0) {
        await aiTab.click();
      } else {
        await page.goto(`${FRONTEND_URL}/self-service?tab=ai-assistant`, { waitUntil: "load" });
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(1500);
      }
      await page.waitForSelector('[data-testid="chat-input"]', { timeout: 20000 });
      const initialAssistantMessages = await page
        .locator('[data-testid="chat-message-assistant"]')
        .allTextContents();
      const initialAssistantText = initialAssistantMessages[initialAssistantMessages.length - 1] || "";
      await page.fill('[data-testid="chat-input"]', "What is the annual leave policy?");
      await page.click('[data-testid="chat-submit"]');

      await page.waitForFunction((initialText) => {
        const loading = document.querySelector('[data-testid="chat-loading"]');
        const userMessages = [...document.querySelectorAll('[data-testid="chat-message-user"]')];
        const messages = [...document.querySelectorAll('[data-testid="chat-message-assistant"]')];
        if (loading) return false;
        if (userMessages.length < 1) return false;
        if (messages.length < 1) return false;
        const last = messages[messages.length - 1].textContent || "";
        return last.length > 20 && last !== initialText;
      }, initialAssistantText, { timeout: 60000 });

      const assistantMessages = await page
        .locator('[data-testid="chat-message-assistant"]')
        .allTextContents();
      result.hrChecks.aiPolicyAnswer = assistantMessages[assistantMessages.length - 1] || "";

      const aiScreenshot = "C:/Users/SH/AppData/Local/Temp/hrc-ai-practical.png";
      await page.screenshot({ path: aiScreenshot, fullPage: true });
      result.screenshots.ai = aiScreenshot;
    } catch (error) {
      result.hrChecks.aiPolicyAnswerError = String(error);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    result.error = String(error);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
