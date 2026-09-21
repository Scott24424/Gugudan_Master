import { test, expect } from '@playwright/test';

test('has title and level indicator', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('신나는 구구단 마스터');
  await expect(page.locator('text=Level 1')).toBeVisible();
});
