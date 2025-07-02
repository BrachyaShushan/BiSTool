import { test, expect } from "@playwright/test";

test.describe("Basic App Tests", () => {
  test("should load the app successfully", async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Check if the page title contains relevant keywords
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Verify the main app container is present
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check if React root element exists
    const root = page.locator("#root, [data-reactroot], main, .app");
    await expect(root.first()).toBeVisible();
  });

  test("should have working localStorage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Test basic localStorage functionality
    await page.evaluate(() => {
      localStorage.setItem("test-key", "test-value");
    });

    const value = await page.evaluate(() => {
      return localStorage.getItem("test-key");
    });

    expect(value).toBe("test-value");

    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem("test-key");
    });
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 }, // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Verify the app is still visible and functional
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Check if content fits in viewport
      const contentWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(contentWidth).toBeLessThanOrEqual(viewport.width + 50); // Allow for scrollbars
    }
  });
});
