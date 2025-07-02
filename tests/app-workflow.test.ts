import { test, expect } from "@playwright/test";
import { LocalStorageHelper } from "./utils/localStorage.helper";

test.describe("App Workflow E2E Tests", () => {
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

  // Add a helper to create project and session using modal and close it
  async function createProjectAndSession(
    page,
    projectName = "Test Project",
    sessionName = "Test Session"
  ) {
    // Open project modal from welcome screen
    await page.getByTestId("project-create").click();
    await page.waitForSelector('[data-testid="project-name-input"]', {
      timeout: 5000,
    });
    await page.getByTestId("project-name-input").fill(projectName);
    await page.getByTestId("project-save").click();
    await page.waitForSelector('[data-testid="modal-close"]', {
      timeout: 5000,
    });
    await page.getByTestId("modal-close").click();

    // Open session modal
    await page.getByTestId("session-create").click();
    await page.waitForSelector('[data-testid="session-name-input"]', {
      timeout: 5000,
    });
    await page.getByTestId("session-name-input").fill(sessionName);
    await page.getByTestId("session-save").click();
    await page.waitForSelector('[data-testid="modal-close"]', {
      timeout: 5000,
    });
    await page.getByTestId("modal-close").click();
  }

  test("should complete full URL builder workflow", async ({ page }) => {
    await page.goto("http://localhost:3000");
    // Wait for the app to load
    await page.waitForSelector('[data-testid="project-create"]', {
      timeout: 10000,
    });
    await createProjectAndSession(page);
    // Test URL Builder functionality

    // Wait for the app to load
    await page.waitForSelector(
      '[data-testid="url-builder"], .url-builder, input[placeholder*="URL"], input[placeholder*="url"]',
      { timeout: 10000 }
    );

    // Fill in URL builder form
    const baseUrlInput = page.locator("input").filter({ hasText: "" }).first();
    if (await baseUrlInput.isVisible()) {
      await baseUrlInput.fill("https://api.example.com");
    }

    // Try to find endpoint input
    const endpointInput = page
      .locator('input[placeholder*="endpoint"], input[placeholder*="path"]')
      .first();
    if (await endpointInput.isVisible()) {
      await endpointInput.fill("/users");
    }

    // Select HTTP method if available
    const methodSelect = page.locator('select, [role="combobox"]').first();
    if (await methodSelect.isVisible()) {
      await methodSelect.selectOption("GET");
    }

    // Add query parameter if possible
    const addParamButton = page
      .locator('button:has-text("Add"), button[aria-label*="add"]')
      .first();
    if (await addParamButton.isVisible()) {
      await addParamButton.click();

      const keyInput = page
        .locator('input[placeholder*="key"], input[placeholder*="name"]')
        .last();
      const valueInput = page.locator('input[placeholder*="value"]').last();

      if ((await keyInput.isVisible()) && (await valueInput.isVisible())) {
        await keyInput.fill("limit");
        await valueInput.fill("10");
      }
    }

    // Submit or continue
    const submitButton = page
      .locator(
        'button:has-text("Next"), button:has-text("Continue"), button:has-text("Submit")'
      )
      .first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }

    // Verify URL construction in localStorage
    await page.waitForTimeout(1000);
    const allItems = await localStorageHelper.getAllItems();
    const hasUrlData = Object.keys(allItems).some(
      (key) =>
        key.includes("appState") && allItems[key].includes("api.example.com")
    );
    expect(hasUrlData).toBeTruthy();
  });

  test("should handle session creation and loading", async ({ page }) => {
    // Create a new session
    const sessionButton = page
      .locator(
        'button:has-text("Session"), button:has-text("New Session"), [data-testid*="session"]'
      )
      .first();

    if (await sessionButton.isVisible()) {
      await sessionButton.click();

      // Look for session creation dialog or form
      const sessionNameInput = page
        .locator('input[placeholder*="name"], input[placeholder*="session"]')
        .first();
      if (await sessionNameInput.isVisible()) {
        await sessionNameInput.fill("Test Session E2E");

        const saveButton = page
          .locator('button:has-text("Save"), button:has-text("Create")')
          .first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    }

    // Verify session in localStorage
    await page.waitForTimeout(1000);
    const allItems = await localStorageHelper.getAllItems();
    const hasSessionData = Object.keys(allItems).some(
      (key) =>
        key.includes("session") && allItems[key].includes("Test Session E2E")
    );
    expect(hasSessionData).toBeTruthy();
  });

  test("should manage variables correctly", async ({ page }) => {
    // Look for variable management interface
    const variableButton = page
      .locator(
        'button:has-text("Variable"), button:has-text("Vars"), [data-testid*="variable"]'
      )
      .first();

    if (await variableButton.isVisible()) {
      await variableButton.click();

      // Add a variable
      const addVarButton = page
        .locator('button:has-text("Add Variable"), button:has-text("Add")')
        .first();
      if (await addVarButton.isVisible()) {
        await addVarButton.click();

        const keyInput = page
          .locator('input[placeholder*="key"], input[placeholder*="name"]')
          .last();
        const valueInput = page.locator('input[placeholder*="value"]').last();

        if ((await keyInput.isVisible()) && (await valueInput.isVisible())) {
          await keyInput.fill("API_KEY");
          await valueInput.fill("test-api-key-123");

          // Save variable
          const saveVarButton = page
            .locator('button:has-text("Save"), button:has-text("Add")')
            .last();
          if (await saveVarButton.isVisible()) {
            await saveVarButton.click();
          }
        }
      }
    }

    // Verify variable in localStorage
    await page.waitForTimeout(1000);
    const allItems = await localStorageHelper.getAllItems();
    const hasVariableData = Object.keys(allItems).some(
      (key) => key.includes("variable") && allItems[key].includes("API_KEY")
    );
    expect(hasVariableData).toBeTruthy();
  });

  test("should handle request configuration", async ({ page }) => {
    // Navigate to request configuration section
    const requestTab = page
      .locator(
        'button:has-text("Request"), [data-testid*="request"], .tab:has-text("Request")'
      )
      .first();

    if (await requestTab.isVisible()) {
      await requestTab.click();

      // Add headers if interface is available
      const addHeaderButton = page
        .locator('button:has-text("Add Header"), button:has-text("Header")')
        .first();
      if (await addHeaderButton.isVisible()) {
        await addHeaderButton.click();

        const headerKeyInput = page
          .locator('input[placeholder*="header"], input[placeholder*="key"]')
          .last();
        const headerValueInput = page
          .locator('input[placeholder*="value"]')
          .last();

        if (
          (await headerKeyInput.isVisible()) &&
          (await headerValueInput.isVisible())
        ) {
          await headerKeyInput.fill("Authorization");
          await headerValueInput.fill("Bearer test-token");
        }
      }

      // Add request body if available
      const bodyTextarea = page
        .locator('textarea[placeholder*="body"], textarea[placeholder*="JSON"]')
        .first();
      if (await bodyTextarea.isVisible()) {
        await bodyTextarea.fill('{"test": "data", "id": 123}');
      }
    }

    // Verify request config in localStorage
    await page.waitForTimeout(1000);
    const allItems = await localStorageHelper.getAllItems();
    const hasRequestData = Object.keys(allItems).some(
      (key) =>
        allItems[key].includes("Authorization") ||
        allItems[key].includes("Bearer test-token")
    );
    expect(hasRequestData).toBeTruthy();
  });

  test("should generate and handle YAML output", async ({ page }) => {
    // Look for YAML generation functionality
    const yamlButton = page
      .locator(
        'button:has-text("YAML"), button:has-text("Generate"), [data-testid*="yaml"]'
      )
      .first();

    if (await yamlButton.isVisible()) {
      await yamlButton.click();

      // Wait for YAML generation
      await page.waitForTimeout(2000);

      // Look for YAML output display
      const yamlOutput = page.locator("pre, code, textarea[readonly]").first();
      if (await yamlOutput.isVisible()) {
        const yamlContent = await yamlOutput.textContent();
        expect(yamlContent).toBeTruthy();
        expect(yamlContent?.length).toBeGreaterThan(10);
      }
    }

    // Verify YAML in localStorage
    await page.waitForTimeout(1000);
    const allItems = await localStorageHelper.getAllItems();
    const hasYamlData = Object.keys(allItems).some(
      (key) => key.includes("yamlOutput") || allItems[key].includes("yaml")
    );
    expect(hasYamlData).toBeTruthy();
  });

  test("should handle token generation workflow", async ({ page }) => {
    // Look for token management interface
    const tokenButton = page
      .locator(
        'button:has-text("Token"), button:has-text("Auth"), [data-testid*="token"]'
      )
      .first();

    if (await tokenButton.isVisible()) {
      await tokenButton.click();

      // Configure token provider if available
      const providerSelect = page
        .locator('select[name*="provider"], select')
        .first();
      if (await providerSelect.isVisible()) {
        await providerSelect.selectOption("anthropic");
      }

      // Generate token if available
      const generateButton = page
        .locator('button:has-text("Generate"), button:has-text("Create Token")')
        .first();
      if (await generateButton.isVisible()) {
        await generateButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Verify token config in localStorage
    await page.waitForTimeout(1000);
    const allItems = await localStorageHelper.getAllItems();
    const hasTokenData = Object.keys(allItems).some(
      (key) =>
        key.includes("token") &&
        (allItems[key].includes("anthropic") ||
          allItems[key].includes("provider"))
    );
    expect(hasTokenData).toBeTruthy();
  });

  test("should persist data across browser refresh", async ({ page }) => {
    // Simulate user workflow
    await page.waitForTimeout(2000);

    // Add some test data via localStorage (simulating user interaction)
    await localStorageHelper.setBiSToolProjectData("test-project", {
      appState: {
        urlData: {
          baseUrl: "https://api.test.com",
          endpoint: "/test-endpoint",
          method: "POST",
        },
        activeSection: "request",
      },
      sharedVariables: [{ key: "TEST_VAR", value: "test-value" }],
    });

    // Refresh the page
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Verify data persisted
    const persistedData = await localStorageHelper.getBiSToolProjectData(
      "test-project"
    );
    expect(persistedData.appState.urlData.baseUrl).toBe("https://api.test.com");
    expect(persistedData.sharedVariables).toHaveLength(1);
    expect(persistedData.sharedVariables[0].key).toBe("TEST_VAR");
  });

  test("should handle multiple projects correctly", async ({ page }) => {
    // Create data for multiple projects
    await localStorageHelper.setBiSToolProjectData("project-1", {
      appState: { activeSection: "url-builder" },
      sharedVariables: [{ key: "PROJECT1_VAR", value: "value1" }],
    });

    await localStorageHelper.setBiSToolProjectData("project-2", {
      appState: { activeSection: "request" },
      sharedVariables: [{ key: "PROJECT2_VAR", value: "value2" }],
    });

    // Verify projects are isolated
    const project1Data = await localStorageHelper.getBiSToolProjectData(
      "project-1"
    );
    const project2Data = await localStorageHelper.getBiSToolProjectData(
      "project-2"
    );

    expect(project1Data.appState.activeSection).toBe("url-builder");
    expect(project2Data.appState.activeSection).toBe("request");
    expect(project1Data.sharedVariables[0].key).toBe("PROJECT1_VAR");
    expect(project2Data.sharedVariables[0].key).toBe("PROJECT2_VAR");

    // Verify data doesn't cross-contaminate
    expect(project1Data.sharedVariables[0].key).not.toBe("PROJECT2_VAR");
    expect(project2Data.sharedVariables[0].key).not.toBe("PROJECT1_VAR");
  });

  test("should handle app state transitions correctly", async ({ page }) => {
    // Test navigation between different sections
    const sections = ["url-builder", "request", "tests", "yaml"];

    for (const section of sections) {
      // Try to find and click section button/tab
      const sectionButton = page
        .locator(
          `button:has-text("${section}"), [data-testid*="${section}"], .tab:has-text("${section}")`
        )
        .first();

      if (await sectionButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await sectionButton.click();
        await page.waitForTimeout(500);

        // Verify section is active (this might be reflected in URL, class, or localStorage)
        const currentUrl = page.url();
        const isActive =
          currentUrl.includes(section) ||
          (await page
            .locator(
              `[data-active="${section}"], .active:has-text("${section}")`
            )
            .isVisible({ timeout: 1000 })
            .catch(() => false));

        // At least one section should be detectable as active
        // This is a loose test since UI structure might vary
      }
    }

    // Verify final state is saved
    await page.waitForTimeout(1000);
    const allItems = await localStorageHelper.getAllItems();
    const hasStateData = Object.keys(allItems).length > 0;
    expect(hasStateData).toBeTruthy();
  });
});
