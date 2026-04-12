const { chromium } = require("playwright");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:4174";

async function waitForAuthenticatedShell(page) {
  await Promise.race([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 }),
    page.waitForSelector('[data-testid="app-sidebar"], nav, aside', { timeout: 30000 }),
    page.waitForSelector('text=لوحة التحكم', { timeout: 30000 }),
  ]);
  await page.waitForTimeout(1000);
}

async function collectDashboardFacts(page) {
  await page.goto(`${FRONTEND_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const body = await page.locator("body").innerText();
  const totalEmployeesMatch = body.match(/إجمالي الموظفين\s+(\d+)/);
  const presentTodayMatch = body.match(/الحضور اليوم\s+(\d+)/);
  return {
    bodySnippet: body.slice(0, 2500),
    totalEmployees: totalEmployeesMatch ? Number(totalEmployeesMatch[1]) : null,
    presentToday: presentTodayMatch ? Number(presentTodayMatch[1]) : null,
  };
}

async function collectEmployeesFacts(page) {
  await page.goto(`${FRONTEND_URL}/employees`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const rows = await page.locator("table tbody tr").count().catch(() => 0);
  const body = await page.locator("body").innerText();
  return {
    bodySnippet: body.slice(0, 2500),
    visibleRows: rows,
  };
}

async function exerciseSelfServiceAI(page) {
  await page.goto(`${FRONTEND_URL}/self-service?tab=ai-assistant`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);

  const aiTab = page.locator('[role="tab"]').filter({ hasText: /المساعد الذكي|AI Assistant/i }).first();
  if (await aiTab.count()) {
    await aiTab.click();
    await page.waitForTimeout(500);
  }

  await page.waitForSelector('[data-testid="chat-input"]', { timeout: 30000 });
  const initialAssistantMessages = await page.locator('[data-testid="chat-message-assistant"]').allTextContents();
  const initialAssistantText = initialAssistantMessages[initialAssistantMessages.length - 1] || "";

  await page.fill('[data-testid="chat-input"]', "ما سياسة الإجازة السنوية؟");
  await page.click('[data-testid="chat-submit"]');

  await page.waitForFunction((initialText) => {
    const loading = document.querySelector('[data-testid="chat-loading"]');
    const assistantMessages = [...document.querySelectorAll('[data-testid="chat-message-assistant"]')];
    if (loading) return false;
    if (assistantMessages.length < 1) return false;
    const last = assistantMessages[assistantMessages.length - 1].textContent || "";
    return last.length > 20 && last !== initialText;
  }, initialAssistantText, { timeout: 90000 });

  const assistantMessages = await page.locator('[data-testid="chat-message-assistant"]').allTextContents();
  return {
    currentUrl: page.url(),
    answer: assistantMessages[assistantMessages.length - 1] || "",
  };
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const result = {
    visited: [],
    apiFailures: [],
    consoleErrors: [],
    pageErrors: [],
    dashboard: {},
    employees: {},
    selfServiceAI: {},
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
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.fill("#username", "admin");
    await page.fill("#password", "admin123");
    await page.locator('form button[type="submit"]').click();
    await waitForAuthenticatedShell(page);

    const routes = [
      ["/", "dashboard"],
      ["/employees", "employees"],
      ["/attendance", "attendance"],
      ["/leaves", "leaves"],
      ["/devices", "devices"],
      ["/device-command-center", "device-command-center"],
      ["/reports", "reports"],
      ["/self-service", "self-service"],
      ["/settings?tab=ai", "settings-ai"],
    ];

    for (const [route, key] of routes) {
      await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(500);
      result.visited.push(route);
      const screenshotPath = `C:/Users/SH/AppData/Local/Temp/hrc-${key}-acceptance.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshots[key] = screenshotPath;
    }

    result.dashboard = await collectDashboardFacts(page);
    result.employees = await collectEmployeesFacts(page);
    result.selfServiceAI = await exerciseSelfServiceAI(page);

    const aiScreenshot = "C:/Users/SH/AppData/Local/Temp/hrc-self-service-ai-acceptance.png";
    await page.screenshot({ path: aiScreenshot, fullPage: true });
    result.screenshots.ai = aiScreenshot;

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    result.error = String(error);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
