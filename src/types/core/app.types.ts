import { ExtendedSession } from "../features/SavedManager";

export type SectionId = "url" | "request" | "tests" | "yaml" | "ai";

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
  method: "POST" | "GET";
  path: string;
  tokenName: string;
  headerKey: string;
  headerValueFormat: string;
  refreshToken: boolean;
  refreshTokenName: string;
  extractionMethods: {
    json: boolean;
    jsonPaths: string[];
    cookies: boolean;
    cookieNames: string[];
    headers: boolean;
    headerNames: string[];
  };
  requestMapping: {
    usernameField: string;
    passwordField: string;
    contentType: "form" | "json";
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
  handleNewSession: () => void;
  handleLoadSession: (session: ExtendedSession) => void;
  handleSaveSession: (name: string, sessionData?: ExtendedSession) => void;
  handleDeleteSession: (id: string) => void;
  handleURLBuilderSubmit: (data: URLData) => void;
  handleRequestConfigSubmit: (data: RequestConfigData) => void;
  handleYAMLGenerated: (yaml: string) => void;
  deleteGlobalVariable: (key: string) => void;
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}
