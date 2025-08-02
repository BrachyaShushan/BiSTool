import {
  URLData,
  RequestConfigData,
  Variable,
  QueryParameter,
  HeaderParameter,
  FormDataField,
  ResponseCondition,
} from "@/types/shared";
import { ExtendedSession } from "@/types/features/SavedManager";
import { SectionId } from "@/types/core/common.types";

export interface Section {
  id: SectionId;
  label: string;
}

// Re-export shared types for backward compatibility
export type QueryParam = QueryParameter;
export type Header = HeaderParameter;

// Re-export the main types
export type {
  URLData,
  RequestConfigData,
  Variable,
  ExtendedSession,
  FormDataField,
  ResponseCondition,
};

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
  segmentVariables: Record<string, string>;
  activeSession: ExtendedSession | null;
  savedSessions: ExtendedSession[];
  methodColor: Record<string, { value: string; label: string; color: string }>;
  isLoading: boolean;
  error: string | null;
  // Mode state
  mode: "basic" | "expert";
  setMode: (mode: "basic" | "expert") => void;
  setUrlData: (data: URLData) => void;
  setRequestConfig: (config: RequestConfigData | null) => void;
  setYamlOutput: (yaml: string) => void;

  setSegmentVariables: (vars: Record<string, string>) => void;
  handleNewSession: () => void;
  handleClearSession: () => void;
  handleLoadSession: (session: ExtendedSession) => void;
  handleSaveSession: (
    name: string,
    sessionData?: ExtendedSession,
    preventNavigation?: boolean
  ) => void;
  handleDeleteSession: (id: string) => void;
  handleImportSessions: (sessions: any[]) => void;
  handleURLBuilderSubmit: (data: URLData) => void;
  handleRequestConfigSubmit: (data: RequestConfigData) => void;
  handleYAMLGenerated: (yaml: string) => void;
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
  openUnifiedManager: (initialTab?: TabType) => void;
  setShowUnifiedManager: (show: boolean) => void;
  unifiedManagerTab: TabType;
  showUnifiedManager: boolean;
  updateSessionVariables: (sessionVariables: Record<string, string>) => void;
}
import { TabType } from "@/types/core/common.types";

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}
