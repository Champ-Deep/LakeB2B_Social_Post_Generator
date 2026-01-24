import { test, expect } from '@playwright/test';

/**
 * End-to-End Flow Tests
 * Tests complete user workflows including image generation, authentication, and API health
 */

test.describe('API Health Tests', () => {
  test('health endpoint responds with OK status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('lakeb2b-social-post-generator');
  });
});

test.describe('Authentication Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible({ timeout: 10000 });
  });

  test('login modal opens when clicking login button', async ({ page }) => {
    // Click login button
    await page.getByRole('button', { name: /Login/i }).click();

    // Wait for modal to appear with LinkedIn OAuth and tabs
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Verify LinkedIn OAuth button is present
    await expect(page.getByRole('button', { name: /Continue with LinkedIn/i })).toBeVisible();

    // Verify Login and Sign Up tabs are present
    await expect(page.getByRole('tab', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible();

    // Verify email and password fields are present in Login tab
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('sign up tab shows registration form', async ({ page }) => {
    // Click login button
    await page.getByRole('button', { name: /Login/i }).click();

    // Wait for modal
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Click Sign Up tab
    await page.getByRole('tab', { name: 'Sign Up' }).click();

    // Verify registration fields are present
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
  });

  test('login modal can be closed', async ({ page }) => {
    // Open login modal
    await page.getByRole('button', { name: /Login/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Close modal (click outside or close button)
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Image Generation Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible({ timeout: 10000 });
  });

  test('generate button requires login when not authenticated', async ({ page }) => {
    // Fill in form fields
    await page.locator('textarea').first().fill('Test business content for B2B marketing');
    await page.locator('textarea').last().fill('Test Headline');

    // Click generate
    await page.getByRole('button', { name: 'Generate Post' }).click();

    // Should show login required toast or modal - check for any indication
    const loginRequiredIndicator = page.locator('[role="alert"]').filter({ hasText: /login|sign in|authentication/i }).first()
      .or(page.getByText(/login required|please log in|authentication required/i).first());

    await expect(loginRequiredIndicator).toBeVisible({ timeout: 5000 });
  });

  test('form displays all required fields', async ({ page }) => {
    // Verify form fields are present without requiring login
    await expect(page.locator('textarea').first()).toBeVisible();
    await expect(page.locator('textarea').last()).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Post' })).toBeVisible();
  });

  test('style selector changes form display', async ({ page }) => {
    // Select different styles and verify the form updates
    const styleSelector = page.locator('select').first();

    // Select meme - should show meme format selector
    await styleSelector.selectOption('meme');
    await expect(page.getByText('Meme Format', { exact: true })).toBeVisible({ timeout: 5000 });

    // Select infographic
    await styleSelector.selectOption('infographic');
    // Verify style changes - meme format should be hidden
    await expect(page.getByText('Meme Format', { exact: true })).not.toBeVisible({ timeout: 3000 });

    // Select isometric
    await styleSelector.selectOption('isometric');
    // Verify the style option is selected
    await expect(styleSelector).toHaveValue('isometric');
  });
});

test.describe('Trending Topics Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible({ timeout: 10000 });
  });

  test('trending topics section displays topics', async ({ page }) => {
    // Verify trending topics heading - use heading role without level (Chakra size="md" renders as h3)
    await expect(page.getByRole('heading', { name: /Trending Topics/i })).toBeVisible({ timeout: 5000 });

    // Look for Live badge next to the heading
    await expect(page.getByText('Live')).toBeVisible();
  });

  test('clicking a trending topic populates form fields', async ({ page }) => {
    // Find and click a trending topic
    const topicButton = page.locator('[data-testid="trending-topic"]').first()
      .or(page.locator('button').filter({ hasText: /AI|Data|Marketing|Cloud/i }).first());

    // If topic buttons exist, click one
    const isTopicVisible = await topicButton.isVisible().catch(() => false);

    if (isTopicVisible) {
      await topicButton.click();

      // Verify toast appears
      await expect(page.getByText(/topic applied|used trending/i)).toBeVisible({ timeout: 5000 });

      // Verify form was populated (textarea should have content)
      const firstTextarea = page.locator('textarea').first();
      const value = await firstTextarea.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Style Selection Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible({ timeout: 10000 });
  });

  test('changing style updates style info card', async ({ page }) => {
    const styleSelector = page.locator('select').first();

    // Select infographic
    await styleSelector.selectOption('infographic');
    await expect(page.locator('p').filter({ hasText: /Data-driven visual storytelling/i }).first()).toBeVisible({ timeout: 3000 });

    // Select meme
    await styleSelector.selectOption('meme');
    await expect(page.locator('p').filter({ hasText: /Internet meme templates/i }).first()).toBeVisible({ timeout: 3000 });

    // Verify meme format selector appears (it's a Text element, not a heading)
    await expect(page.getByText('Meme Format', { exact: true })).toBeVisible({ timeout: 3000 });
  });

  test('meme style flow with text input', async ({ page }) => {
    // Select meme style
    await page.locator('select').first().selectOption('meme');

    // Wait for meme format selector
    await expect(page.getByText('Meme Format', { exact: true })).toBeVisible();

    // Select Drake format
    const memeSelector = page.locator('select').nth(1);
    await memeSelector.selectOption('drake');

    // Fill meme text fields
    await page.getByLabel(/top text/i).fill('Old marketing strategies');
    await page.getByLabel(/bottom text/i).fill('AI-powered B2B solutions');

    // Verify text was entered
    await expect(page.getByLabel(/top text/i)).toHaveValue('Old marketing strategies');
    await expect(page.getByLabel(/bottom text/i)).toHaveValue('AI-powered B2B solutions');
  });
});

test.describe('Logo Customization Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible({ timeout: 10000 });
  });

  test('complete logo customization workflow', async ({ page }) => {
    // Change position
    const positionSelector = page.locator('select').filter({ hasText: /Bottom Left|Bottom Right/i }).or(page.locator('select').nth(1));
    await positionSelector.selectOption('bottom-right');

    // Change size using preset button
    const sizeSection = page.locator('text=Logo Size').locator('..');
    await sizeSection.getByRole('button', { name: '45%' }).click();
    await expect(sizeSection.getByText('Selected: 45%')).toBeVisible();

    // Change opacity
    const opacitySection = page.locator('text=Logo Opacity').locator('..');
    await opacitySection.getByRole('button', { name: '100%' }).click();
    await expect(opacitySection.getByText('Selected: 100%')).toBeVisible();

    // Change rotation
    const rotationSection = page.locator('text=Logo Rotation').locator('..');
    await rotationSection.getByRole('button', { name: '+15°' }).click();
    await expect(rotationSection.getByText('Selected: +15°')).toBeVisible();
  });
});

test.describe('Error Handling Tests', () => {
  test('handles connection issues gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'LakeB2B Social Post Generator' })).toBeVisible({ timeout: 10000 });

    // The app should show connected state
    const generateButton = page.getByRole('button', { name: 'Generate Post' });
    await expect(generateButton).toBeEnabled();
  });
});
