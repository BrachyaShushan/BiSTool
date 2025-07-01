import { ExtendedSession } from "../features/SavedManager";

export type SectionId = "url" | "request" | "tests" | "yaml" | "ai" | "import";

export interface Section {
  id: SectionId;
  label: string;
}

export interface QueryParam {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
  type?: string;
}

export interface Header {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
  type?: string;
  in: "path" | "header" | "query";
}

export interface FormDataField {
  key: string;
  value: string;
  type: "text" | "file";
  required: boolean;
  description?: string;
}

export interface URLData {
  domain: string;
  protocol: string;
  builtUrl: string;
  environment: string;
  baseURL: string;
  processedURL: string;
  segments: string;
  parsedSegments: Array<{
    paramName: string;
    description?: string;
    required?: boolean;
    value: string;
    isDynamic: boolean;
  }>;
  queryParams: QueryParam[];
  segmentVariables: Array<{
    key: string;
    value: string;
  }>;
  sessionDescription?: string;
}

export interface RequestConfigData {
  method: string;
  headers: Header[];
  queryParams: QueryParam[];
  bodyType: "none" | "json" | "form" | "text";
  jsonBody?: string;
  formData?: FormDataField[];
  textBody?: string;
  body?: Record<string, any>;
}

export interface Variable {
  key: string;
  value: string;
}

export interface TokenConfig {
  domain: string;
  method: "POST" | "GET" | "PUT" | "PATCH";
  path: string;
  tokenName: string;
  headerKey: string;
  headerValueFormat: string;
  refreshToken: boolean;
  refreshTokenName: string;

  // Enhanced authentication types
  authType: "basic" | "bearer" | "api_key" | "oauth2" | "session" | "custom";

  // OAuth2 specific configuration
  oauth2?: {
    grantType:
      | "authorization_code"
      | "client_credentials"
      | "password"
      | "implicit";
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string;
    authorizationUrl: string;
    tokenUrl: string;
    refreshUrl?: string;
  };

  // API Key configuration
  apiKey?: {
    keyName: string;
    keyValue: string;
    location: "header" | "query" | "cookie";
    prefix?: string;
  };

  // Session-based authentication
  session?: {
    sessionIdField: string;
    sessionTokenField: string;
    keepAlive: boolean;
    keepAliveInterval: number;
  };

  // Enhanced extraction methods with priority and patterns
  extractionMethods: {
    json: boolean;
    jsonPaths: string[];
    cookies: boolean;
    cookieNames: string[];
    headers: boolean;
    headerNames: string[];
    // New extraction methods
    regex: boolean;
    regexPatterns: string[];
    xpath: boolean;
    xpathExpressions: string[];
    css: boolean;
    cssSelectors: string[];
    // Advanced JSON extraction with nested paths
    nestedJson: boolean;
    nestedPaths: Array<{
      path: string;
      type: "string" | "object" | "array";
      transform?: "base64_decode" | "url_decode" | "json_parse" | "none";
    }>;
  };

  // Enhanced request mapping for different auth types
  requestMapping: {
    usernameField: string;
    passwordField: string;
    contentType: "form" | "json" | "xml" | "multipart";
    // Additional fields for different auth types
    additionalFields: Array<{
      name: string;
      value: string;
      type: "static" | "variable" | "dynamic";
      required: boolean;
    }>;
    // Custom headers for the request
    customHeaders: Array<{
      name: string;
      value: string;
      type: "static" | "variable";
    }>;
  };

  // Token validation and refresh configuration
  validation: {
    validateOnExtract: boolean;
    validationEndpoint?: string;
    validationMethod: "GET" | "POST";
    validationHeaders: Array<{
      name: string;
      value: string;
    }>;
    autoRefresh: boolean;
    refreshThreshold: number; // minutes before expiry
    maxRefreshAttempts: number;
  };

  // Security and encryption
  security: {
    encryptToken: boolean;
    encryptionKey?: string;
    hashToken: boolean;
    hashAlgorithm: "sha256" | "sha512" | "md5";
    maskTokenInLogs: boolean;
  };

  // Error handling and fallback
  errorHandling: {
    retryOnFailure: boolean;
    maxRetries: number;
    retryDelay: number;
    fallbackAuth?: "basic" | "api_key" | "session";
    customErrorMessages: Record<string, string>;
  };
}

export interface ResponseCondition {
  status: string; // e.g. "204", "400", "201"
  condition: string; // user-provided text
  include: boolean; // whether to include this response
}

export interface Session {
  id: string;
  name: string;
  timestamp: string;
  category?: string;
  urlData?: URLData;
  requestConfig?: RequestConfigData;
  yamlOutput?: string;
  responseConditions?: ResponseCondition[];
}

export interface AppContextType {
  urlData: URLData;
  requestConfig: RequestConfigData | null;
  yamlOutput: string;
  activeSection: SectionId;
  segmentVariables: Record<string, string>;
  sharedVariables: Variable[];
  activeSession: ExtendedSession | null;
  savedSessions: ExtendedSession[];
  globalVariables: Record<string, string>;
  tokenConfig: TokenConfig;
  methodColor: Record<string, { value: string; label: string; color: string }>;
  isLoading: boolean;
  error: string | null;
  setUrlData: (data: URLData) => void;
  setRequestConfig: (config: RequestConfigData | null) => void;
  setYamlOutput: (yaml: string) => void;
  setActiveSection: (section: SectionId) => void;
  setSegmentVariables: (vars: Record<string, string>) => void;
  setTokenConfig: (
    config: TokenConfig | ((prev: TokenConfig) => TokenConfig)
  ) => void;
  updateSharedVariable: (key: string, value: string) => void;
  deleteSharedVariable: (key: string) => void;
  updateGlobalVariable: (key: string, value: string) => void;
  updateSessionVariable: (key: string, value: string) => void;
  deleteSessionVariable: (key: string) => void;
  handleNewSession: () => void;
  handleLoadSession: (session: ExtendedSession) => void;
  handleSaveSession: (name: string, sessionData?: ExtendedSession) => void;
  handleDeleteSession: (id: string) => void;
  handleImportSessions: (sessions: any[]) => void;
  openSessionManager: (options?: {
    tab?: "sessions" | "variables" | "projects";
  }) => void;
  handleURLBuilderSubmit: (data: URLData) => void;
  handleRequestConfigSubmit: (data: RequestConfigData) => void;
  handleYAMLGenerated: (yaml: string) => void;
  deleteGlobalVariable: (key: string) => void;
  regenerateToken: () => Promise<void>;
  generateAuthHeaders: () => Record<string, string>;
  getCurrentToken: () => string | null;
  isAuthenticated: () => boolean;
  // Save manager properties
  autoSave: boolean;
  isSaving: boolean;
  lastSaved?: string | undefined;
  hasUnsavedChanges: boolean;
  saveFrequency: number;
  manualSave: () => Promise<void>;
  toggleAutoSave: (enabled: boolean) => void;
  updateSaveFrequency: (frequency: number) => void;
  undo: () => void;
  redo: () => void;
  isUndoAvailable: boolean;
  isRedoAvailable: boolean;
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}
