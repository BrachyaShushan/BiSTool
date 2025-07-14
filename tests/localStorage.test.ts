import { test, expect } from "@playwright/test";
import { LocalStorageHelper } from "./utils/localStorage.helper";

test.describe("LocalStorage Functionality", () => {
  let localStorageHelper: LocalStorageHelper;
  const testProjectId = "test-project-" + Date.now();

  test.beforeEach(async ({ page }) => {
    localStorageHelper = new LocalStorageHelper(page);
    // Clear localStorage before each test
    await localStorageHelper.clear();
    // Navigate to the app
    await page.goto("/");
    // Wait for the app to load
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async () => {
    // Clean up localStorage after each test
    await localStorageHelper.clear();
  });

  test("should initialize localStorage with proper structure", async ({
    page,
  }) => {
    // Wait for the app to initialize
    await page.waitForTimeout(2000);

    // Check if localStorage has been initialized
    const keys = await localStorageHelper.getAllKeys();
    expect(keys.length).toBeGreaterThan(0);

    // Verify BiSTool-specific keys exist
    const biSToolKeys = keys.filter((key) => key.startsWith("bistool_"));
    expect(biSToolKeys.length).toBeGreaterThan(0);
  });

  test("should persist app state correctly", async ({ page }) => {
    // Simulate user interaction that should save app state
    const testData = {
      urlData: {
        baseUrl: "https://api.example.com",
        endpoint: "/users",
        method: "GET",
        pathParams: [],
        queryParams: [],
      },
      activeSection: "url-builder",
    };

    // Set test data in localStorage
    await localStorageHelper.setBiSToolProjectData(testProjectId, {
      appState: testData,
    });

    // Reload page to test persistence
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify data persisted
    const savedData = await localStorageHelper.getBiSToolProjectData(
      testProjectId
    );
    expect(savedData.appState).toMatchObject(testData);
  });

  test("should handle session management in localStorage", async ({ page }) => {
    const testSession = {
      id: "session-123",
      name: "Test Session",
      createdAt: new Date().toISOString(),
      urlData: {
        baseUrl: "https://api.test.com",
        endpoint: "/test",
        method: "POST",
      },
      sharedVariables: {
        api_key: "test-key-123",
        user_id: "456",
      },
    };

    // Save session data
    await localStorageHelper.setBiSToolProjectData(testProjectId, {
      activeSession: testSession,
      savedSessions: [testSession],
    });

    // Verify session data persisted
    const savedData = await localStorageHelper.getBiSToolProjectData(
      testProjectId
    );
    expect(savedData.activeSession).toMatchObject(testSession);
    expect(savedData.savedSessions).toHaveLength(1);
    expect(savedData.savedSessions[0]).toMatchObject(testSession);
  });

  test("should handle shared variables persistence", async ({ page }) => {
    const testVariables = [
      { key: "API_BASE_URL", value: "https://api.production.com" },
      { key: "API_VERSION", value: "v2" },
      { key: "AUTH_TOKEN", value: "bearer-token-123" },
    ];

    // Save shared variables
    await localStorageHelper.setBiSToolProjectData(testProjectId, {
      sharedVariables: testVariables,
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify variables persisted
    const savedData = await localStorageHelper.getBiSToolProjectData(
      testProjectId
    );
    expect(savedData.sharedVariables).toEqual(testVariables);
  });

  test("should handle token configuration persistence", async ({ page }) => {
    const testTokenConfig = {
      provider: "anthropic",
      apiUrl: "https://api.anthropic.com",
      tokenName: "ANTHROPIC_API_KEY",
      refreshTokenName: "ANTHROPIC_REFRESH_TOKEN",
      expiresIn: 3600,
      lastGenerated: new Date().toISOString(),
    };

    // Save token config
    await localStorageHelper.setBiSToolProjectData(testProjectId, {
      tokenConfig: testTokenConfig,
    });

    // Verify token config persisted
    const savedData = await localStorageHelper.getBiSToolProjectData(
      testProjectId
    );
    expect(savedData.tokenConfig).toMatchObject(testTokenConfig);
  });

  test("should handle localStorage quota efficiently", async ({ page }) => {
    // Test with large amount of data to check efficiency
    const largeSessionData = Array.from({ length: 50 }, (_, i) => ({
      id: `session-${i}`,
      name: `Test Session ${i}`,
      createdAt: new Date().toISOString(),
      urlData: {
        baseUrl: `https://api${i}.test.com`,
        endpoint: `/test${i}`,
        method: "GET",
      },
      sharedVariables: Object.fromEntries(
        Array.from({ length: 10 }, (_, j) => [`var${j}`, `value${i}-${j}`])
      ),
    }));

    // Save large amount of data
    await localStorageHelper.setBiSToolProjectData(testProjectId, {
      savedSessions: largeSessionData,
    });

    // Verify data saved successfully
    const savedData = await localStorageHelper.getBiSToolProjectData(
      testProjectId
    );
    expect(savedData.savedSessions).toHaveLength(50);

    // Check localStorage usage is reasonable
    const allItems = await localStorageHelper.getAllItems();
    const totalSize = JSON.stringify(allItems).length;

    // Should be less than 5MB (localStorage typical limit is 5-10MB)
    expect(totalSize).toBeLessThan(5 * 1024 * 1024);
  });

  test("should handle concurrent localStorage operations", async ({ page }) => {
    // Simulate concurrent operations
    const operations = [
      localStorageHelper.setBiSToolProjectData(testProjectId, {
        appState: { activeSection: "url-builder" },
      }),
      localStorageHelper.setBiSToolProjectData(testProjectId, {
        sharedVariables: [{ key: "test1", value: "value1" }],
      }),
      localStorageHelper.setBiSToolProjectData(testProjectId, {
        tokenConfig: { provider: "test" },
      }),
    ];

    // Execute all operations concurrently
    await Promise.all(operations);

    // Verify all data was saved correctly
    const savedData = await localStorageHelper.getBiSToolProjectData(
      testProjectId
    );
    expect(savedData.appState.activeSection).toBe("url-builder");
    expect(savedData.sharedVariables).toHaveLength(1);
    expect(savedData.tokenConfig.provider).toBe("test");
  });

  test("should handle localStorage corruption gracefully", async ({ page }) => {
    // Set corrupted JSON data
    await localStorageHelper.setItem(
      `bistool_${testProjectId}_appState`,
      "{invalid json}"
    );

    // Try to read the corrupted data
    const corruptedData = await localStorageHelper.getItemAsJSON(
      `bistool_${testProjectId}_appState`
    );
    expect(corruptedData).toBeNull();

    // App should still function and create new data
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify app recovered and created new data structure
    await page.waitForTimeout(2000);
    const keys = await localStorageHelper.getAllKeys();
    expect(keys.length).toBeGreaterThan(0);
  });

  test("should maintain data compatibility across page reloads", async ({
    page,
  }) => {
    const complexData = {
      appState: {
        urlData: {
          baseUrl: "https://complex.api.com",
          endpoint: "/complex/endpoint",
          method: "POST",
          pathParams: [{ key: "id", value: "123" }],
          queryParams: [{ key: "filter", value: "active" }],
        },
        requestConfig: {
          headers: [{ key: "Authorization", value: "Bearer token" }],
          body: '{"test": "data"}',
          timeout: 5000,
        },
        activeSection: "request",
      },
      savedSessions: [
        {
          id: "session-1",
          name: "Complex Session",
          createdAt: new Date().toISOString(),
          urlData: { baseUrl: "https://test.com" },
        },
      ],
      sharedVariables: [
        { key: "API_KEY", value: "secret-key" },
        { key: "BASE_URL", value: "https://api.com" },
      ],
    };

    // Save complex data
    await localStorageHelper.setBiSToolProjectData(testProjectId, complexData);

    // Reload page multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Verify data integrity after each reload
      const reloadedData = await localStorageHelper.getBiSToolProjectData(
        testProjectId
      );
      expect(reloadedData.appState.urlData.baseUrl).toBe(
        complexData.appState.urlData.baseUrl
      );
      expect(reloadedData.savedSessions).toHaveLength(1);
      expect(reloadedData.sharedVariables).toHaveLength(2);
    }
  });

  test("should handle project switching correctly", async ({ page }) => {
    const project1Id = "project-1";
    const project2Id = "project-2";

    // Set data for project 1
    await localStorageHelper.setBiSToolProjectData(project1Id, {
      appState: { activeSection: "project1-section" },
      sharedVariables: [{ key: "project1-var", value: "value1" }],
    });

    // Set data for project 2
    await localStorageHelper.setBiSToolProjectData(project2Id, {
      appState: { activeSection: "project2-section" },
      sharedVariables: [{ key: "project2-var", value: "value2" }],
    });

    // Verify both projects have separate data
    const project1Data = await localStorageHelper.getBiSToolProjectData(
      project1Id
    );
    const project2Data = await localStorageHelper.getBiSToolProjectData(
      project2Id
    );

    expect(project1Data.appState.activeSection).toBe("project1-section");
    expect(project2Data.appState.activeSection).toBe("project2-section");
    expect(project1Data.sharedVariables[0].key).toBe("project1-var");
    expect(project2Data.sharedVariables[0].key).toBe("project2-var");
  });

  test("should persist mode setting (basic/expert) correctly", async ({
    page,
  }) => {
    // First, create a project and set it as active
    await localStorageHelper.setBiSToolProjectData(testProjectId, {
      settings: { mode: "basic" },
    });

    // Set this project as the active project
    await localStorageHelper.setItem("bistool_active_project", testProjectId);

    // Reload page to test persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Verify mode setting persisted
    const savedData = await localStorageHelper.getBiSToolProjectData(
      testProjectId
    );
    expect(savedData.settings.mode).toBe("basic");

    // Test switching to expert mode
    await localStorageHelper.setBiSToolProjectData(testProjectId, {
      settings: { mode: "expert" },
    });

    // Reload again
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Verify expert mode persisted
    const updatedData = await localStorageHelper.getBiSToolProjectData(
      testProjectId
    );
    expect(updatedData.settings.mode).toBe("expert");
  });

  test("should persist selected template across page refreshes", async ({
    page,
  }) => {
    const testTemplateId = "template-123";

    // Set this project as the active project
    await localStorageHelper.setItem("bistool_active_project", testProjectId);

    // Set a selected template for the project
    await localStorageHelper.setItem(
      `${testProjectId}_bistool_selected_template`,
      testTemplateId
    );

    // Reload page to test persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Verify selected template persisted
    const savedTemplateId = await localStorageHelper.getItem(
      `${testProjectId}_bistool_selected_template`
    );
    expect(savedTemplateId).toBe(testTemplateId);

    // Test changing the selected template
    const newTemplateId = "template-456";
    await localStorageHelper.setItem(
      `${testProjectId}_bistool_selected_template`,
      newTemplateId
    );

    // Reload again
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Verify new template persisted
    const updatedTemplateId = await localStorageHelper.getItem(
      `${testProjectId}_bistool_selected_template`
    );
    expect(updatedTemplateId).toBe(newTemplateId);
  });

  test("should handle project-specific template selection", async ({
    page,
  }) => {
    const project1Id = "project-1";
    const project2Id = "project-2";
    const template1Id = "template-project1";
    const template2Id = "template-project2";

    // Set different selected templates for different projects
    await localStorageHelper.setItem(
      `${project1Id}_bistool_selected_template`,
      template1Id
    );
    await localStorageHelper.setItem(
      `${project2Id}_bistool_selected_template`,
      template2Id
    );

    // Verify each project has its own selected template
    const project1Template = await localStorageHelper.getItem(
      `${project1Id}_bistool_selected_template`
    );
    const project2Template = await localStorageHelper.getItem(
      `${project2Id}_bistool_selected_template`
    );

    expect(project1Template).toBe(template1Id);
    expect(project2Template).toBe(template2Id);

    // Verify templates are independent
    expect(project1Template).not.toBe(project2Template);
  });
});
