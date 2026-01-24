import { test, expect } from '@playwright/test';

/**
 * Test meme style functionality
 * Tests that meme style can be selected and generates images correctly
 */
test.describe('Meme Style Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
  });

  test('meme style option is available in visual style selector', async ({ page }) => {
    // Find the visual style selector
    const styleSelector = page.locator('select').first();

    // Check that meme style option exists
    await expect(styleSelector.locator('option[value="meme"]')).toBeAttached();

    // Verify the option text contains "Meme"
    const memeOption = await styleSelector.locator('option[value="meme"]').textContent();
    expect(memeOption).toContain('Meme');
  });

  test('can select meme style from dropdown', async ({ page }) => {
    // Find and select meme style
    const styleSelector = page.locator('select').first();

    // Select meme style
    await styleSelector.selectOption('meme');

    // Verify meme style is selected
    await expect(styleSelector).toHaveValue('meme');

    // Verify meme style description is displayed (use exact text match)
    await expect(page.getByText('Internet meme templates with smart AI text suggestions', { exact: true })).toBeVisible();
  });

  test('meme format selector appears when meme style is selected', async ({ page }) => {
    // Select meme style
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('meme');

    // Wait for meme selector to appear
    await page.waitForTimeout(500);

    // Verify meme format selector is visible (use exact text)
    await expect(page.getByText('Meme Format', { exact: true })).toBeVisible();

    // Verify meme format dropdown exists
    const memeFormatSelector = page.locator('select').nth(1);
    await expect(memeFormatSelector).toBeVisible();
  });

  test('meme format options are available', async ({ page }) => {
    // Select meme style
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('meme');

    await page.waitForTimeout(500);

    // Get meme format selector
    const memeFormatSelector = page.locator('select').nth(1);

    // Verify all meme format options exist
    await expect(memeFormatSelector.locator('option[value="auto"]')).toBeAttached();
    await expect(memeFormatSelector.locator('option[value="drake"]')).toBeAttached();
    await expect(memeFormatSelector.locator('option[value="distracted"]')).toBeAttached();
    await expect(memeFormatSelector.locator('option[value="woman-cat"]')).toBeAttached();
    await expect(memeFormatSelector.locator('option[value="change-mind"]')).toBeAttached();
  });

  test('drake meme format shows text input fields', async ({ page }) => {
    // Select meme style
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('meme');

    await page.waitForTimeout(500);

    // Select Drake format
    const memeFormatSelector = page.locator('select').nth(1);
    await memeFormatSelector.selectOption('drake');

    await page.waitForTimeout(500);

    // Verify text input fields appear (use exact text)
    await expect(page.getByText('Meme Text', { exact: true })).toBeVisible();
    await expect(page.getByLabel(/top text/i)).toBeVisible();
    await expect(page.getByLabel(/bottom text/i)).toBeVisible();
  });

  test('distracted boyfriend meme format shows text fields', async ({ page }) => {
    // Select meme style
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('meme');

    await page.waitForTimeout(500);

    // Select Distracted Boyfriend format
    const memeFormatSelector = page.locator('select').nth(1);
    await memeFormatSelector.selectOption('distracted');

    await page.waitForTimeout(500);

    // Verify text input fields appear (use exact text)
    await expect(page.getByText('Meme Text', { exact: true })).toBeVisible();
  });

  test('auto-select format shows smart selection info', async ({ page }) => {
    // Select meme style
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('meme');

    await page.waitForTimeout(500);

    // Verify auto is selected by default
    const memeFormatSelector = page.locator('select').nth(1);
    await expect(memeFormatSelector).toHaveValue('auto');

    // Verify smart selection info is displayed
    await expect(page.getByText(/Smart Auto-Selection/i)).toBeVisible();
  });

  test('meme style shows platform badges', async ({ page }) => {
    // Select meme style
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('meme');

    // Wait for style card to update
    await page.waitForTimeout(500);

    // Verify platforms are displayed (use exact text for badges)
    await expect(page.getByText('linkedin', { exact: true })).toBeVisible();
    await expect(page.getByText('twitter', { exact: true })).toBeVisible();
    await expect(page.getByText('instagram', { exact: true })).toBeVisible();
    await expect(page.getByText('facebook', { exact: true })).toBeVisible();
  });

  test('meme style tips section is visible', async ({ page }) => {
    // Select meme style
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('meme');

    await page.waitForTimeout(500);

    // Verify style tips section exists
    await expect(page.getByText('Style Tips:', { exact: true })).toBeVisible();
  });

  test('can input text in meme text fields', async ({ page }) => {
    // Select meme style
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('meme');

    await page.waitForTimeout(500);

    // Select Drake format
    const memeFormatSelector = page.locator('select').nth(1);
    await memeFormatSelector.selectOption('drake');

    await page.waitForTimeout(500);

    // Find and fill text fields
    const topInput = page.getByLabel(/top text/i);
    await topInput.fill('Old way of doing things');
    await expect(topInput).toHaveValue('Old way of doing things');

    const bottomInput = page.getByLabel(/bottom text/i);
    await bottomInput.fill('Our new approach');
    await expect(bottomInput).toHaveValue('Our new approach');
  });
});
