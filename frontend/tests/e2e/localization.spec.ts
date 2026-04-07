import { test, expect } from '@playwright/test';

test.describe('Localization Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    const langSwitcher = page.locator('button:has-text("العربية"), .lang-select');
    const currentLang = await page.getAttribute('html', 'lang');
    if (currentLang !== 'ar' && await langSwitcher.isVisible()) {
      await langSwitcher.click();
      await page.waitForTimeout(500);
    }
  });

  test('Check HTML attributes for RTL and lang', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');
  });

  test('Check translated text visibility', async ({ page }) => {
    await expect(page.locator('text=إدارة طلبات التوظيف')).toBeVisible();
    await expect(page.locator('text=سجلات المراجعة')).toBeVisible();
  });

  test('Check Cairo font usage', async ({ page }) => {
    const fontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    expect(fontFamily).toContain('Cairo');
  });

  test('Hardcoded English Detector', async ({ page }) => {
    const bodyText = await page.innerText('body');
    const englishWords = bodyText.match(/[a-zA-Z]{4,}/g) || [];
    const staticExemptions = [
      'CSV', 'Excel', 'PWA', 'HTTP', 'Sentry', 'Pro', 
      'Vite', 'React', 'Dash', 'HRCompanion', 'Companion',
      'API', 'JSON', 'Local', 'Auth', 'User', 'Role'
    ];
    const unexpectedEnglish = englishWords.filter(word => {
      return !staticExemptions.some(ex => ex.toLowerCase() === word.toLowerCase());
    });
    expect(unexpectedEnglish.length).toBeLessThan(15); 
  });
});
