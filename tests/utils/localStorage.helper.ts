import { Page } from "@playwright/test";

export class LocalStorageHelper {
  constructor(private page: Page) {}

  /**
   * Get all localStorage items
   */
  async getAllItems(): Promise<Record<string, string>> {
    try {
      return await this.page.evaluate(() => {
        const items: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            items[key] = localStorage.getItem(key) || "";
          }
        }
        return items;
      });
    } catch (e) {
      throw new Error(
        "localStorage is not accessible. Make sure you have navigated to the app and the page is loaded."
      );
    }
  }

  /**
   * Get a specific localStorage item
   */
  async getItem(key: string): Promise<string | null> {
    return await this.page.evaluate((key) => localStorage.getItem(key), key);
  }

  /**
   * Set a localStorage item
   */
  async setItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      { key, value }
    );
  }

  /**
   * Remove a specific localStorage item
   */
  async removeItem(key: string): Promise<void> {
    await this.page.evaluate((key) => localStorage.removeItem(key), key);
  }

  /**
   * Clear all localStorage
   */
  async clear(): Promise<void> {
    try {
      await this.page.evaluate(() => localStorage.clear());
    } catch (error) {
      // Ignore localStorage access errors (e.g., when page hasn't loaded properly)
      console.warn("localStorage.clear() failed:", error);
    }
  }

  /**
   * Get localStorage size
   */
  async getSize(): Promise<number> {
    return await this.page.evaluate(() => localStorage.length);
  }

  /**
   * Check if localStorage contains a specific key
   */
  async hasItem(key: string): Promise<boolean> {
    return await this.page.evaluate(
      (key) => localStorage.getItem(key) !== null,
      key
    );
  }

  /**
   * Get all keys from localStorage
   */
  async getAllKeys(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    });
  }

  /**
   * Get parsed JSON from localStorage
   */
  async getItemAsJSON<T>(key: string): Promise<T | null> {
    const item = await this.getItem(key);
    if (item === null) return null;
    try {
      return JSON.parse(item);
    } catch (error) {
      console.error(
        `Failed to parse localStorage item "${key}" as JSON:`,
        error
      );
      return null;
    }
  }

  /**
   * Set JSON object to localStorage
   */
  async setItemAsJSON(key: string, value: any): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }

  /**
   * Wait for localStorage to contain a specific key
   */
  async waitForItem(key: string, timeout = 5000): Promise<void> {
    await this.page.waitForFunction(
      (key) => localStorage.getItem(key) !== null,
      key,
      { timeout }
    );
  }

  /**
   * Wait for localStorage to not contain a specific key
   */
  async waitForItemRemoval(key: string, timeout = 5000): Promise<void> {
    await this.page.waitForFunction(
      (key) => localStorage.getItem(key) === null,
      key,
      { timeout }
    );
  }

  /**
   * Verify localStorage data structure for BiSTool
   */
  async verifyBiSToolStructure(projectId: string): Promise<boolean> {
    const expectedKeys = [
      `bistool_${projectId}_appState`,
      `bistool_${projectId}_sessions_active`,
      `bistool_${projectId}_sessions_saved`,
      `bistool_${projectId}_variables_shared`,
      `bistool_${projectId}_token_config`,
    ];

    const existingKeys = await this.getAllKeys();
    const biSToolKeys = existingKeys.filter((key) =>
      key.startsWith("bistool_")
    );

    return expectedKeys.every((key) => biSToolKeys.includes(key));
  }

  /**
   * Get BiSTool project data
   */
  async getBiSToolProjectData(projectId: string): Promise<{
    appState: any;
    activeSession: any;
    savedSessions: any[];
    sharedVariables: any[];
    tokenConfig: any;
  }> {
    const [
      appState,
      activeSession,
      savedSessions,
      sharedVariables,
      tokenConfig,
    ] = await Promise.all([
      this.getItemAsJSON(`bistool_${projectId}_appState`),
      this.getItemAsJSON(`bistool_${projectId}_sessions_active`),
      this.getItemAsJSON(`bistool_${projectId}_sessions_saved`),
      this.getItemAsJSON(`bistool_${projectId}_variables_shared`),
      this.getItemAsJSON(`bistool_${projectId}_token_config`),
    ]);

    return {
      appState: appState || {},
      activeSession: activeSession || null,
      savedSessions: (savedSessions as any[]) || [],
      sharedVariables: (sharedVariables as any[]) || [],
      tokenConfig: tokenConfig || {},
    };
  }

  /**
   * Set BiSTool project data
   */
  async setBiSToolProjectData(
    projectId: string,
    data: {
      appState?: any;
      activeSession?: any;
      savedSessions?: any[];
      sharedVariables?: any[];
      tokenConfig?: any;
    }
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    if (data.appState !== undefined) {
      promises.push(
        this.setItemAsJSON(`bistool_${projectId}_appState`, data.appState)
      );
    }
    if (data.activeSession !== undefined) {
      promises.push(
        this.setItemAsJSON(
          `bistool_${projectId}_sessions_active`,
          data.activeSession
        )
      );
    }
    if (data.savedSessions !== undefined) {
      promises.push(
        this.setItemAsJSON(
          `bistool_${projectId}_sessions_saved`,
          data.savedSessions
        )
      );
    }
    if (data.sharedVariables !== undefined) {
      promises.push(
        this.setItemAsJSON(
          `bistool_${projectId}_variables_shared`,
          data.sharedVariables
        )
      );
    }
    if (data.tokenConfig !== undefined) {
      promises.push(
        this.setItemAsJSON(
          `bistool_${projectId}_token_config`,
          data.tokenConfig
        )
      );
    }

    await Promise.all(promises);
  }
}
