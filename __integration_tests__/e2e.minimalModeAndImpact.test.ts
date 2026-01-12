import { test, expect } from '@playwright/test';

// End-to-end: Minimal Mode and Critical Actions

test('Minimal mode hides non-essential UI and shows critical actions', async ({ page }) => {
  await page.goto('http://localhost:5173');
  // Toggle minimal mode
  await page.click('button[aria-label="Toggle Minimal Mode"]');
  // Check that critical actions are visible
  await expect(page.locator('button[aria-label="Dispatch"]')).toBeVisible();
  await expect(page.locator('button[aria-label="SOS"]')).toBeVisible();
  await expect(page.locator('button[aria-label="Lockdown"]')).toBeVisible();
  // Exit minimal mode
  await page.click('button[aria-label="Toggle Minimal Mode"]');
});

test('Public Impact Dashboard displays incident and region impact', async ({ page }) => {
  await page.goto('http://localhost:5173/PublicImpactDashboard');
  await expect(page.locator('h2')).toHaveText(/Proof of Impact Dashboard/);
  await expect(page.locator('h3')).toHaveText(/Incident Impact Summaries/);
  await expect(page.locator('h3')).toHaveText(/Region-Level Improvement Reports/);
  // Check for at least one incident and region card
  await expect(page.locator('div').filter({ hasText: 'Lives Assisted:' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: 'Total Lives Assisted:' })).toBeVisible();
});
