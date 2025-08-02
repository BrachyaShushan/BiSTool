import { ExtendedSession } from "@/types";
import { URLData, RequestConfigData, Variable, TokenConfig } from "@/types";
import { DEFAULT_GLOBAL_VARIABLES } from "@/constants/variables";

// New hierarchical storage structure
export interface ProjectData {
  metadata: {
    projectId: string;
    projectName: string;
    createdAt: string;
    lastModified: string;
    version: string;
  };
  settings: {
    theme: "light" | "dark";
    autoSave: boolean;
    saveFrequency: number;
    defaultEnvironment: string;
    mode: "basic" | "expert";
  };
  appState: {
    urlData: URLData;
    requestConfig: RequestConfigData | null;
    yamlOutput: string;
    segmentVariables: Record<string, string>;
  };
  sessions: {
    activeSession: ExtendedSession | null;
    savedSessions: ExtendedSession[];
  };
  variables: {
    shared: Variable[];
    global: Record<string, string>;
  };
  tokenConfig: TokenConfig;
  categories: {
    [categoryId: string]: {
      categoryName: string;
      sessions: {
        [sessionId: string]: {
          config: any;
          variables: any;
          tests: any;
        };
      };
    };
  };
}

// Unified storage root structure
export interface BiSToolStorageRoot {
  theme: string;
  defaultAutoSave?: boolean;
  projects: {
    [projectId: string]: ProjectData;
  };
}

export const STORAGE_ROOT_KEY = "bistool_data";

// Helper to get the full storage root
export function getStorageRoot(): BiSToolStorageRoot {
  const raw = localStorage.getItem(STORAGE_ROOT_KEY);
  if (!raw) {
    return { theme: "light", defaultAutoSave: true, projects: {} };
  }
  try {
    const parsed = JSON.parse(raw);
    // Ensure defaultAutoSave exists for backward compatibility
    if (parsed.defaultAutoSave === undefined) {
      parsed.defaultAutoSave = true;
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse bistool_data root:", e);
    return { theme: "light", defaultAutoSave: true, projects: {} };
  }
}

// Helper to save the full storage root
export function setStorageRoot(root: BiSToolStorageRoot) {
  localStorage.setItem(STORAGE_ROOT_KEY, JSON.stringify(root));
}

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

// Default project data structure
export const createDefaultProjectData = (
  projectId: string,
  projectName: string,
  preserveSettings?: boolean
): ProjectData => {
  // Check if there's an existing project to preserve settings
  const root = getStorageRoot();
  const existingProject = root.projects[projectId];

  // Get default auto-save setting from root or use true as fallback
  const defaultAutoSave =
    root.defaultAutoSave !== undefined ? root.defaultAutoSave : true;

  return {
    metadata: {
      projectId,
      projectName,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: "1.0.0",
    },
    settings: {
      theme:
        preserveSettings && existingProject
          ? existingProject.settings.theme
          : "light",
      autoSave:
        preserveSettings && existingProject
          ? existingProject.settings.autoSave
          : defaultAutoSave,
      saveFrequency:
        preserveSettings && existingProject
          ? existingProject.settings.saveFrequency
          : 300,
      defaultEnvironment:
        preserveSettings && existingProject
          ? existingProject.settings.defaultEnvironment
          : "development",
      mode:
        preserveSettings && existingProject
          ? existingProject.settings.mode
          : "expert",
    },
    appState: {
      urlData:
        preserveSettings && existingProject
          ? existingProject.appState.urlData
          : DEFAULT_URL_DATA,
      requestConfig:
        preserveSettings && existingProject
          ? existingProject.appState.requestConfig
          : null,
      yamlOutput:
        preserveSettings && existingProject
          ? existingProject.appState.yamlOutput
          : "",
      segmentVariables:
        preserveSettings && existingProject
          ? existingProject.appState.segmentVariables
          : {},
    },
    sessions: {
      activeSession:
        preserveSettings && existingProject
          ? existingProject.sessions.activeSession
          : null,
      savedSessions:
        preserveSettings && existingProject
          ? existingProject.sessions.savedSessions
          : [],
    },
    variables: {
      shared:
        preserveSettings && existingProject
          ? existingProject.variables.shared
          : [],
      global:
        preserveSettings && existingProject
          ? existingProject.variables.global
          : DEFAULT_GLOBAL_VARIABLES,
    },
    tokenConfig:
      preserveSettings && existingProject
        ? existingProject.tokenConfig
        : DEFAULT_TOKEN_CONFIG,
    categories:
      preserveSettings && existingProject ? existingProject.categories : {},
  };
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

export class StorageManager {
  private currentProjectId: string | null = null;

  setCurrentProject(projectId: string | null): void {
    this.currentProjectId = projectId;
  }

  // Helper method to get storage root for external access
  getStorageRoot(): BiSToolStorageRoot {
    return getStorageRoot();
  }

  // Get the current project data (or default)
  getCurrentProjectData(projectName: string): ProjectData {
    if (!this.currentProjectId) {
      console.error("StorageManager: No current project set");
      throw new Error("No current project set");
    }

    const root = getStorageRoot();

    if (!root.projects[this.currentProjectId]) {
      // Create default if missing
      root.projects[this.currentProjectId] = createDefaultProjectData(
        this.currentProjectId,
        projectName,
        false // Don't preserve settings for new projects
      );
      setStorageRoot(root);
    }

    const projectData = root.projects[this.currentProjectId]!;
    return projectData;
  }

  // Get project data by ID without setting current project
  getProjectData(projectId: string, projectName: string): ProjectData {
    const root = getStorageRoot();

    if (!root.projects[projectId]) {
      // Create default if missing
      root.projects[projectId] = createDefaultProjectData(
        projectId,
        projectName,
        false // Don't preserve settings for new projects
      );
      setStorageRoot(root);
    }

    const projectData = root.projects[projectId]!;
    return projectData;
  }

  // Save the current project data
  saveCurrentProjectData(data: ProjectData) {
    if (!this.currentProjectId) throw new Error("No current project set");
    const root = getStorageRoot();
    root.projects[this.currentProjectId] = data;
    setStorageRoot(root);
  }

  // Update a section of the current project
  updateAppState(appState: ProjectData["appState"], projectName: string): void {
    const data = this.getCurrentProjectData(projectName);
    data.appState = appState;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }
  updateSessions(sessions: ProjectData["sessions"], projectName: string): void {
    const data = this.getCurrentProjectData(projectName);
    data.sessions = sessions;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }
  updateVariables(
    variables: ProjectData["variables"],
    projectName: string
  ): void {
    const data = this.getCurrentProjectData(projectName);
    data.variables = variables;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }
  updateTokenConfig(tokenConfig: TokenConfig, projectName: string): void {
    const data = this.getCurrentProjectData(projectName);
    data.tokenConfig = tokenConfig;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }
  updateSettings(settings: ProjectData["settings"], projectName: string): void {
    const data = this.getCurrentProjectData(projectName);
    data.settings = settings;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }

  // Mode-specific methods for easier access
  saveMode(mode: "basic" | "expert", projectName: string): void {
    const data = this.getCurrentProjectData(projectName);
    data.settings.mode = mode;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }

  loadMode(projectName: string): "basic" | "expert" {
    return this.getCurrentProjectData(projectName).settings.mode;
  }
  updateCategories(
    categories: ProjectData["categories"],
    projectName: string
  ): void {
    const data = this.getCurrentProjectData(projectName);
    data.categories = categories;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }

  // Load all project data
  loadProjectData(projectId: string, projectName: string): ProjectData {
    this.setCurrentProject(projectId);
    return this.getCurrentProjectData(projectName);
  }
  saveProjectData(projectId: string, data: ProjectData) {
    const root = getStorageRoot();
    root.projects[projectId] = data;
    setStorageRoot(root);
  }

  // Legacy compatibility methods (deprecated but kept for migration)
  saveAppState(state: ProjectData["appState"], projectName: string): void {
    this.updateAppState(state, projectName);
  }
  loadAppState(projectName: string): ProjectData["appState"] {
    const appState = this.getCurrentProjectData(projectName).appState;
    return appState;
  }
  saveActiveSession(
    session: ExtendedSession | null,
    projectName: string
  ): void {
    const data = this.getCurrentProjectData(projectName);
    data.sessions.activeSession = session;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }
  loadActiveSession(projectName: string): ExtendedSession | null {
    return this.getCurrentProjectData(projectName).sessions.activeSession;
  }
  saveSavedSessions(sessions: ExtendedSession[], projectName: string): void {
    const data = this.getCurrentProjectData(projectName);
    data.sessions.savedSessions = sessions;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }
  loadSavedSessions(projectName: string): ExtendedSession[] {
    return this.getCurrentProjectData(projectName).sessions.savedSessions;
  }
  saveSharedVariables(variables: Variable[], projectName: string): void {
    const data = this.getCurrentProjectData(projectName);
    data.variables.shared = variables;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }
  loadSharedVariables(projectName: string): Variable[] {
    return this.getCurrentProjectData(projectName).variables.shared;
  }
  saveGlobalVariables(
    variables: Record<string, string>,
    projectName: string
  ): void {
    const data = this.getCurrentProjectData(projectName);
    data.variables.global = variables;
    data.metadata.lastModified = new Date().toISOString();
    this.saveCurrentProjectData(data);
  }
  loadGlobalVariables(projectName: string): Record<string, string> {
    return this.getCurrentProjectData(projectName).variables.global;
  }
  saveTokenConfig(config: TokenConfig, projectName: string): void {
    this.updateTokenConfig(config, projectName);
  }
  loadTokenConfig(projectName: string): TokenConfig {
    return this.getCurrentProjectData(projectName).tokenConfig;
  }
  clearProjectData(projectId: string): void {
    const root = getStorageRoot();
    delete root.projects[projectId];
    setStorageRoot(root);
  }
  // Migration helper to convert old flat structure to new hierarchical structure
  migrateFromFlatStructure(
    projectId: string,
    projectName: string
  ): ProjectData {
    // ...implement as needed, merging into the root.projects[projectId]...
    // For now, just create default
    const root = getStorageRoot();
    const defaultData = createDefaultProjectData(projectId, projectName);
    root.projects[projectId] = defaultData;
    setStorageRoot(root);
    return defaultData;
  }
}
