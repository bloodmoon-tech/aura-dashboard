import { test, expect } from '@playwright/test';

test('create scan and see results', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('button:has-text("New Scan")');
  await page.fill('input[name="target"]', 'https://example.com');
  await page.click('button:has-text("Start Scan")');
  await expect(page.locator('text=Scan started')).toBeVisible();
  await page.waitForSelector('table >> text=Candidate', { timeout: 60000 });
  await expect(page.locator('table')).toContainText('Candidate');
});
