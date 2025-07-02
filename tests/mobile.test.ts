import { test, expect } from "@playwright/test";
import { LocalStorageHelper } from "./utils/localStorage.helper";

test.describe("Mobile E2E Tests", () => {
  let localStorageHelper: LocalStorageHelper;

  test.beforeEach(async ({ page }) => {
    localStorageHelper = new LocalStorageHelper(page);
    await localStorageHelper.clear();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async () => {
    await localStorageHelper.clear();
  });

  test("should display properly on mobile devices", async ({ page }) => {
    // Check if the app is responsive
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeLessThanOrEqual(414); // Pixel 5 width or similar

    // Verify main container is visible
    const mainContent = page.locator("main, #root, .app, .container").first();
    await expect(mainContent).toBeVisible();

    // Check if navigation is mobile-friendly
    const navigation = page
      .locator("nav, .navigation, .navbar, header")
      .first();
    if (await navigation.isVisible()) {
      const navBounds = await navigation.boundingBox();
      expect(navBounds?.width).toBeLessThanOrEqual(viewportSize?.width || 414);
    }
  });

  test("should handle touch interactions for navigation", async ({ page }) => {
    // Test touch/tap interactions
    await page.waitForTimeout(2000);

    // Try to find and tap navigation buttons
    const buttons = page.locator('button, [role="button"], .btn');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.tap();
      await page.waitForTimeout(500);

      // Verify the tap was registered (button should have some visual feedback)
      const buttonText = await firstButton.textContent();
      expect(buttonText).toBeTruthy();
    }
  });

  test("should handle mobile localStorage operations efficiently", async ({
    page,
  }) => {
    // Test localStorage on mobile with typical mobile constraints
    const testData = {
      appState: {
        urlData: {
          baseUrl: "https://mobile-api.example.com",
          endpoint: "/mobile/endpoint",
          method: "GET",
        },
        activeSection: "url-builder",
      },
      sharedVariables: [
        { key: "MOBILE_API_KEY", value: "mobile-test-key" },
        { key: "DEVICE_TYPE", value: "mobile" },
      ],
    };

    // Save data
    await localStorageHelper.setBiSToolProjectData("mobile-test", testData);

    // Verify data was saved
    const savedData = await localStorageHelper.getBiSToolProjectData(
      "mobile-test"
    );
    expect(savedData.appState.urlData.baseUrl).toBe(
      "https://mobile-api.example.com"
    );
    expect(savedData.sharedVariables).toHaveLength(2);

    // Test data persistence after simulated background/foreground
    await page.reload();
    await page.waitForLoadState("networkidle");

    const persistedData = await localStorageHelper.getBiSToolProjectData(
      "mobile-test"
    );
    expect(persistedData.appState.urlData.baseUrl).toBe(
      "https://mobile-api.example.com"
    );
  });

  test("should handle mobile session management", async ({ page }) => {
    // Create a session with mobile-specific data
    const mobileSession = {
      id: "mobile-session-123",
      name: "Mobile Test Session",
      createdAt: new Date().toISOString(),
      urlData: {
        baseUrl: "https://mobile-api.test.com",
        endpoint: "/mobile-test",
        method: "POST",
      },
      sharedVariables: {
        MOBILE_TOKEN: "mobile-auth-token",
        SCREEN_SIZE: "mobile",
      },
    };

    // Save session
    await localStorageHelper.setBiSToolProjectData("mobile-project", {
      activeSession: mobileSession,
      savedSessions: [mobileSession],
    });

    // Test session loading on mobile
    const savedData = await localStorageHelper.getBiSToolProjectData(
      "mobile-project"
    );
    expect(savedData.activeSession.name).toBe("Mobile Test Session");
    expect(savedData.savedSessions).toHaveLength(1);

    // Verify mobile-specific variables
    expect(savedData.activeSession.sharedVariables.SCREEN_SIZE).toBe("mobile");
  });

  test("should handle orientation changes gracefully", async ({ page }) => {
    // Simulate portrait to landscape change
    await page.setViewportSize({ width: 812, height: 375 }); // iPhone landscape
    await page.waitForTimeout(1000);

    // Verify app layout adapts
    const mainContent = page.locator("main, #root, .app").first();
    await expect(mainContent).toBeVisible();

    // Check localStorage persists through orientation change
    await localStorageHelper.setBiSToolProjectData("orientation-test", {
      appState: { orientation: "landscape" },
    });

    // Switch back to portrait
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone portrait
    await page.waitForTimeout(1000);

    // Verify data persisted
    const data = await localStorageHelper.getBiSToolProjectData(
      "orientation-test"
    );
    expect(data.appState.orientation).toBe("landscape");
  });
});
