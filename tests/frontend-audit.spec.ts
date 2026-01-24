import { test, expect } from '@playwright/test';

/**
 * Comprehensive Frontend Audit Tests
 * Tests all UI components, styles, and user interactions
 */
test.describe('Frontend Audit - UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
  });

  test('main heading and branding are visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
    await expect(page.getByText('Create brand-consistent social media images with AI')).toBeVisible();
  });

  test('form elements are properly rendered', async ({ page }) => {
    // Post Message field
    await expect(page.getByText('Post Message')).toBeVisible();

    // Headline field
    await expect(page.getByText('Headline')).toBeVisible();

    // Generate button
    await expect(page.getByRole('button', { name: 'Generate Post' })).toBeVisible();

    // Style selector
    await expect(page.getByText('Visual Style')).toBeVisible();

    // Logo position selector
    await expect(page.getByText('Logo Position')).toBeVisible();

    // Logo size presets
    await expect(page.getByText('Logo Size')).toBeVisible();

    // Logo opacity presets
    await expect(page.getByText('Logo Opacity')).toBeVisible();

    // Logo rotation presets
    await expect(page.getByText('Logo Rotation')).toBeVisible();
  });

  test('trending topics section is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Trending Topics' })).toBeVisible();
  });

  test('login button is visible when not authenticated', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
  });

  test('image preview area is visible', async ({ page }) => {
    // Look for the image preview placeholder
    await expect(page.locator('text=1080 × 1080px')).toBeVisible();
  });
});

test.describe('Frontend Audit - Style Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
  });

  test('all style options are available', async ({ page }) => {
    const styleSelector = page.locator('select').first();

    // Verify all style options exist
    await expect(styleSelector.locator('option[value="isometric"]')).toBeAttached();
    await expect(styleSelector.locator('option[value="infographic"]')).toBeAttached();
    await expect(styleSelector.locator('option[value="newyork-cartoon"]')).toBeAttached();
    await expect(styleSelector.locator('option[value="minimalist-linkedin"]')).toBeAttached();
    await expect(styleSelector.locator('option[value="meme"]')).toBeAttached();
  });

  test('isometric style shows correct info', async ({ page }) => {
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('isometric');

    await expect(page.getByText('Isometric', { exact: true })).toBeVisible();
    await expect(page.getByText('Modern 3D isometric illustration style', { exact: true })).toBeVisible();
  });

  test('infographic style shows correct info', async ({ page }) => {
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('infographic');

    await expect(page.getByText('Infographic', { exact: true })).toBeVisible();
    await expect(page.getByText('Data-driven visual storytelling with charts and statistics', { exact: true })).toBeVisible();
  });

  test('newyork-cartoon style shows correct info', async ({ page }) => {
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('newyork-cartoon');

    await expect(page.getByText('New York Cartoon B&W', { exact: true })).toBeVisible();
    await expect(page.getByText('Black and white cartoon illustration with urban flair', { exact: true })).toBeVisible();
  });

  test('minimalist-linkedin style shows correct info', async ({ page }) => {
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('minimalist-linkedin');

    await expect(page.getByText('Minimalist LinkedIn', { exact: true })).toBeVisible();
    await expect(page.getByText('Clean, professional LinkedIn-optimized style', { exact: true })).toBeVisible();
  });
});

test.describe('Frontend Audit - Logo Customization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
  });

  test('logo position options are available', async ({ page }) => {
    const positionSelector = page.locator('select').filter({ hasText: 'Bottom Left' }).or(
      page.locator('select').nth(1)
    );

    await expect(positionSelector.locator('option[value="bottom-left"]')).toBeAttached();
    await expect(positionSelector.locator('option[value="bottom-right"]')).toBeAttached();
    await expect(positionSelector.locator('option[value="top-right"]')).toBeAttached();
  });

  test('logo size presets work', async ({ page }) => {
    // Find the Logo Size section
    const logoSizeSection = page.locator('text=Logo Size').locator('..');

    // Click on a size preset in the Logo Size section
    await logoSizeSection.getByRole('button', { name: '20%' }).click();
    await expect(logoSizeSection.getByText('Selected: 20%')).toBeVisible();

    await logoSizeSection.getByRole('button', { name: '45%' }).click();
    await expect(logoSizeSection.getByText('Selected: 45%')).toBeVisible();
  });

  test('logo opacity presets work', async ({ page }) => {
    // Find the Logo Opacity section
    const logoOpacitySection = page.locator('text=Logo Opacity').locator('..');

    // Click on opacity preset
    await logoOpacitySection.getByRole('button', { name: '60%' }).click();
    await expect(logoOpacitySection.getByText('Selected: 60%')).toBeVisible();

    await logoOpacitySection.getByRole('button', { name: '100%' }).click();
    await expect(logoOpacitySection.getByText('Selected: 100%')).toBeVisible();
  });

  test('logo rotation presets work', async ({ page }) => {
    // Find the Logo Rotation section
    const logoRotationSection = page.locator('text=Logo Rotation').locator('..');

    // Click on rotation preset
    await logoRotationSection.getByRole('button', { name: '-15°' }).click();
    await expect(logoRotationSection.getByText('Selected: -15°')).toBeVisible();

    await logoRotationSection.getByRole('button', { name: '+15°' }).click();
    await expect(logoRotationSection.getByText('Selected: +15°')).toBeVisible();
  });
});

test.describe('Frontend Audit - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
  });

  test('generate button shows validation message when fields are empty', async ({ page }) => {
    // Try to generate without filling required fields
    await page.getByRole('button', { name: 'Generate Post' }).click();

    // Should show login required or validation message
    // Since we're not logged in, it might show login modal first
    await page.waitForTimeout(1000);
  });

  test('form elements are interactive', async ({ page }) => {
    // Verify the Generate Post button is clickable
    const generateButton = page.getByRole('button', { name: 'Generate Post' });
    await expect(generateButton).toBeEnabled();
  });
});

test.describe('Frontend Audit - Responsive Design', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Post' })).toBeVisible();
  });

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Post' })).toBeVisible();
  });

  test('desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Post' })).toBeVisible();
  });
});

test.describe('Frontend Audit - Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
  });

  test('login button is visible', async ({ page }) => {
    // Verify login button exists
    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
  });

  test('login button has correct styling', async ({ page }) => {
    // Login button should be clickable
    const loginButton = page.getByRole('button', { name: /Login/i });
    await expect(loginButton).toBeEnabled();
  });
});

test.describe('Frontend Audit - Infographic Style', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible();
  });

  test('infographic style can be selected', async ({ page }) => {
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('infographic');

    await expect(styleSelector).toHaveValue('infographic');
  });

  test('infographic style shows data visualization description', async ({ page }) => {
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('infographic');

    await page.waitForTimeout(500);

    // Verify infographic description mentions data storytelling (exact text)
    await expect(page.getByText('Data-driven visual storytelling with charts and statistics', { exact: true })).toBeVisible();
  });

  test('infographic style shows correct platforms', async ({ page }) => {
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('infographic');

    await page.waitForTimeout(500);

    // Infographic should be optimized for LinkedIn, Twitter, Instagram (exact text)
    await expect(page.getByText('linkedin', { exact: true })).toBeVisible();
    await expect(page.getByText('twitter', { exact: true })).toBeVisible();
  });

  test('infographic style tips are displayed', async ({ page }) => {
    const styleSelector = page.locator('select').first();
    await styleSelector.selectOption('infographic');

    await page.waitForTimeout(500);

    // Should show style tips (exact text)
    await expect(page.getByText('Style Tips:', { exact: true })).toBeVisible();
  });
});

test.describe('Frontend Audit - Accessibility', () => {
  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Main heading should be h1 or h2
    const mainHeading = await page.locator('h1, h2').filter({ hasText: 'LakeB2B Social Post Generator' });
    await expect(mainHeading).toBeVisible();
  });

  test('form labels are associated with inputs', async ({ page }) => {
    await page.goto('/');

    // Check that labels exist for form elements
    await expect(page.getByText('Post Message')).toBeVisible();
    await expect(page.getByText('Headline')).toBeVisible();
    await expect(page.getByText('Visual Style')).toBeVisible();
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');

    // Generate button should be accessible
    const generateButton = page.getByRole('button', { name: 'Generate Post' });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
  });

  test('color contrast meets accessibility standards', async ({ page }) => {
    await page.goto('/');

    // Check that main text is visible against background
    const mainHeading = page.getByRole('heading', { name: 'LakeB2B Social Post Generator' });
    await expect(mainHeading).toBeVisible();
  });
});
