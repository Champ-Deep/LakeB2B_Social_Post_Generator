/**
 * Gubey Mascot E2E Tests
 *
 * Tests for the Gubey animated mascot assistant.
 */

import { test, expect } from '@playwright/test';

test.describe('Gubey Mascot', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('should appear after 2 second delay', async ({ page }) => {
    await page.goto('/');

    // Should not be visible immediately
    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await expect(gubeyButton).not.toBeVisible();

    // Wait for 2.5 seconds (2s delay + buffer)
    await page.waitForTimeout(2500);

    // Should now be visible
    await expect(gubeyButton).toBeVisible();
  });

  test('should have correct positioning', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await expect(gubeyButton).toBeVisible();

    // Check positioning (fixed, bottom-right)
    const boundingBox = await gubeyButton.boundingBox();
    expect(boundingBox).toBeTruthy();

    if (boundingBox) {
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        // Should be near bottom-right
        expect(boundingBox.x).toBeGreaterThan(viewportSize.width - 150);
        expect(boundingBox.y).toBeGreaterThan(viewportSize.height - 200);
      }
    }
  });

  test('should show tooltip on hover', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await expect(gubeyButton).toBeVisible();

    // Hover over button
    await gubeyButton.hover();

    // Tooltip should appear (wait a bit for animation)
    await page.waitForTimeout(500);

    // Check for tooltip text (should contain a tip message)
    const tooltip = page.locator('text=/Ready to create|meme style|Try isometric/');
    await expect(tooltip).toBeVisible();
  });

  test('should open panel on click', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await expect(gubeyButton).toBeVisible();

    // Click the button
    await gubeyButton.click();

    // Wait for panel animation
    await page.waitForTimeout(600);

    // Panel should be visible
    const panel = page.locator('[role="dialog"][aria-label="Gubey Assistant Panel"]');
    await expect(panel).toBeVisible();

    // Should contain mascot info
    await expect(page.locator('text=Gubey')).toBeVisible();
    await expect(page.locator('text=Your content assistant')).toBeVisible();
  });

  test('should close panel with ESC key', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    // Open panel
    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await gubeyButton.click();
    await page.waitForTimeout(600);

    // Panel should be visible
    const panel = page.locator('[role="dialog"][aria-label="Gubey Assistant Panel"]');
    await expect(panel).toBeVisible();

    // Press ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Panel should be closed
    await expect(panel).not.toBeVisible();
  });

  test('should close panel with close button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    // Open panel
    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await gubeyButton.click();
    await page.waitForTimeout(600);

    // Click close button
    const closeButton = page.locator('[aria-label="Close Gubey assistant"]');
    await closeButton.click();
    await page.waitForTimeout(300);

    // Panel should be closed
    const panel = page.locator('[role="dialog"][aria-label="Gubey Assistant Panel"]');
    await expect(panel).not.toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    // Tab to the button
    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await expect(gubeyButton).toBeVisible();

    // Focus the button
    await gubeyButton.focus();
    await expect(gubeyButton).toBeFocused();

    // Press Enter to open
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);

    // Panel should be visible
    const panel = page.locator('[role="dialog"][aria-label="Gubey Assistant Panel"]');
    await expect(panel).toBeVisible();
  });

  test('should not overlap with ConnectionStatus', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    const connectionStatus = page.locator('text=Connected').first();

    await expect(gubeyButton).toBeVisible();
    await expect(connectionStatus).toBeVisible();

    const gubeyBox = await gubeyButton.boundingBox();
    const connectionBox = await connectionStatus.boundingBox();

    if (gubeyBox && connectionBox) {
      // Gubey should be above ConnectionStatus (higher y means lower on screen)
      expect(gubeyBox.y).toBeLessThan(connectionBox.y);
    }
  });

  test('should remember visited state in localStorage', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    // Interact with Gubey
    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await gubeyButton.click();
    await page.waitForTimeout(1000);

    // Check localStorage
    const visited = await page.evaluate(() => localStorage.getItem('gubey_visited'));
    expect(visited).toBe('true');

    // Reload and verify no greeting animation (would need to check animation state)
    await page.reload();
    await page.waitForTimeout(2500);

    // Button should still be visible
    await expect(gubeyButton).toBeVisible();
  });
});

test.describe('Gubey Mascot - Reduced Motion', () => {
  test('should respect reduced motion preference', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await page.waitForTimeout(2500);

    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await expect(gubeyButton).toBeVisible();

    // Button should still work but with reduced animations
    await gubeyButton.click();
    await page.waitForTimeout(300);

    const panel = page.locator('[role="dialog"][aria-label="Gubey Assistant Panel"]');
    await expect(panel).toBeVisible();
  });
});

test.describe('Gubey Mascot - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be visible on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await expect(gubeyButton).toBeVisible();
  });

  test('should open panel on tap', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);

    const gubeyButton = page.locator('[aria-label="Open Gubey assistant"]');
    await gubeyButton.tap();
    await page.waitForTimeout(600);

    const panel = page.locator('[role="dialog"][aria-label="Gubey Assistant Panel"]');
    await expect(panel).toBeVisible();
  });
});
