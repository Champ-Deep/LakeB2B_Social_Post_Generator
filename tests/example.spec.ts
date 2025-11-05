import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/LakeB2B/);
});

test('simplified form is visible', async ({ page }) => {
  await page.goto('/');

  // Check if the post generator heading is visible
  await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();

  // Check if the simplified form elements are present
  await expect(page.getByLabel('Post Message')).toBeVisible();
  await expect(page.getByLabel('Headline')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate Post' })).toBeVisible();

  // Check that size display shows square format
  await expect(page.getByText('1080 × 1080px (Square Format)')).toBeVisible();
});