import { ExtendedSession } from "../types/features/SavedManager";
import {
  URLData,
  RequestConfigData,
  Variable,
  SectionId,
  TokenConfig,
} from "../types";

// Storage keys
export const STORAGE_KEYS = {
  APP_STATE: "app_state",
  ACTIVE_SESSION: "active_session",
  SAVED_SESSIONS: "saved_sessions",
  SHARED_VARIABLES: "shared_variables",
  TOKEN_CONFIG: "token_config",
} as const;

// Default values
export const DEFAULT_URL_DATA: URLData = {
  baseURL: "",
  segments: "",
  parsedSegments: [],
  queryParams: [],
  segmentVariables: [],
  processedURL: "",
  domain: "",
  protocol: "https",
  builtUrl: "",
  environment: "development",
};

export const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  domain: "http://{base_url}",
  method: "POST",
  path: "/auth/login",
  tokenName: "x-access-token",
  headerKey: "x-access-token",
  headerValueFormat: "{token}",
  refreshToken: false,
  refreshTokenName: "refresh_token",
  authType: "bearer",
  oauth2: {
    grantType: "password",
    clientId: "",
    clientSecret: "",
    redirectUri: "",
    scope: "",
    authorizationUrl: "",
    tokenUrl: "",
    refreshUrl: "",
  },
  apiKey: {
    keyName: "X-API-Key",
    keyValue: "",
    location: "header",
    prefix: "",
  },
  session: {
    sessionIdField: "session_id",
    sessionTokenField: "session_token",
    keepAlive: false,
    keepAliveInterval: 300,
  },
  extractionMethods: {
    json: false,
    jsonPaths: [],
    cookies: false,
    cookieNames: [],
    headers: false,
    headerNames: [],
    regex: false,
    regexPatterns: [],
    xpath: false,
    xpathExpressions: [],
    css: false,
    cssSelectors: [],
    nestedJson: false,
    nestedPaths: [],
  },
  requestMapping: {
    usernameField: "username",
    passwordField: "password",
    contentType: "form",
    additionalFields: [],
    customHeaders: [],
  },
  validation: {
    validateOnExtract: false,
    validationEndpoint: "",
    validationMethod: "GET",
    validationHeaders: [],
    autoRefresh: false,
    refreshThreshold: 5,
    maxRefreshAttempts: 3,
  },
  security: {
    encryptToken: false,
    encryptionKey: "",
    hashToken: false,
    hashAlgorithm: "sha256",
    maskTokenInLogs: true,
  },
  errorHandling: {
    retryOnFailure: true,
    maxRetries: 3,
    retryDelay: 1000,
    customErrorMessages: {},
  },
};

// Helper function to safely parse JSON
export const safeParseJSON = function <T>(
  jsonString: string,
  defaultValue: T
): T {
  try {
    return JSON.parse(jsonString) || defaultValue;
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    return defaultValue;
  }
};

// Storage operations with error handling
export class StorageManager {
  private getProjectStorageKey: (key: string) => string;

  constructor(getProjectStorageKey: (key: string) => string) {
    this.getProjectStorageKey = getProjectStorageKey;
  }

  // Generic save operation
  private save<T>(key: string, data: T): void {
    try {
      const storageKey = this.getProjectStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
      throw new Error(`Failed to save ${key}: ${err}`);
    }
  }

  // Generic load operation
  private load<T>(key: string, defaultValue: T): T {
    try {
      const storageKey = this.getProjectStorageKey(key);
      const savedData = localStorage.getItem(storageKey);
      return savedData ? safeParseJSON(savedData, defaultValue) : defaultValue;
    } catch (err) {
      console.error(`Failed to load ${key}:`, err);
      return defaultValue;
    }
  }

  // App state operations
  saveAppState(state: {
    urlData: URLData;
    requestConfig: RequestConfigData | null;
    yamlOutput: string;
    activeSection: SectionId;
    segmentVariables: Record<string, string>;
    globalVariables: Record<string, string>;
  }): void {
    this.save(STORAGE_KEYS.APP_STATE, state);
  }

  loadAppState(): {
    urlData: URLData;
    requestConfig: RequestConfigData | null;
    yamlOutput: string;
    activeSection: SectionId;
    segmentVariables: Record<string, string>;
    globalVariables: Record<string, string>;
  } {
    return this.load(STORAGE_KEYS.APP_STATE, {
      urlData: DEFAULT_URL_DATA,
      requestConfig: null,
      yamlOutput: "",
      activeSection: "url",
      segmentVariables: {},
      globalVariables: {},
    });
  }

  // Session operations
  saveActiveSession(session: ExtendedSession | null): void {
    this.save(STORAGE_KEYS.ACTIVE_SESSION, session);
  }

  loadActiveSession(): ExtendedSession | null {
    return this.load(STORAGE_KEYS.ACTIVE_SESSION, null);
  }

  saveSavedSessions(sessions: ExtendedSession[]): void {
    this.save(STORAGE_KEYS.SAVED_SESSIONS, sessions);
  }

  loadSavedSessions(): ExtendedSession[] {
    return this.load(STORAGE_KEYS.SAVED_SESSIONS, []);
  }

  // Shared variables operations
  saveSharedVariables(variables: Variable[]): void {
    this.save(STORAGE_KEYS.SHARED_VARIABLES, variables);
  }

  loadSharedVariables(): Variable[] {
    return this.load(STORAGE_KEYS.SHARED_VARIABLES, []);
  }

  // Token config operations
  saveTokenConfig(config: TokenConfig): void {
    this.save(STORAGE_KEYS.TOKEN_CONFIG, config);
  }

  loadTokenConfig(): TokenConfig {
    return this.load(STORAGE_KEYS.TOKEN_CONFIG, DEFAULT_TOKEN_CONFIG);
  }

  // Clear all project data
  clearProjectData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        const storageKey = this.getProjectStorageKey(key);
        localStorage.removeItem(storageKey);
      });
    } catch (err) {
      console.error("Failed to clear project data:", err);
    }
  }
}
