import { test, expect } from '@playwright/test';

test('signup -> login -> access dashboard', async ({ page, baseURL }) => {
  await page.goto('/auth/sign-up');
  await page.fill('input[name="email"]', 'qa+user@example.com');
  await page.fill('input[name="password"]', 'Str0ngPass!');
  // If form has confirm password field
  const hasConfirm = await page.locator('input[name="confirmPassword"]').count();
  if (hasConfirm) await page.fill('input[name="confirmPassword"]', 'Str0ngPass!');
  await page.click('button[type="submit"]');

  // Attempt login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'qa+user@example.com');
  await page.fill('input[name="password"]', 'Str0ngPass!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator('text=Sign out')).toBeVisible();
});
