const { chromium } = require("playwright");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:5173";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 75 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const result = {
    apiFailures: [],
    consoleErrors: [],
    pageErrors: [],
    aiAnswer: "",
    screenshot: "C:/Users/SH/AppData/Local/Temp/hrc-self-service-ai-chat.png",
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
    result.aiAnswer = assistantMessages[assistantMessages.length - 1] || "";
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
