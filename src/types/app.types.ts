import { ExtendedSession } from "./SavedManager";

export type SectionId = "url" | "request" | "yaml" | "ai";

export interface Section {
  id: SectionId;
  label: string;
}

export interface QueryParam {
  key: string;
  value: string;
  description: string;
  required: boolean;
}

export interface Header {
  key: string;
  value: string;
  description: string;
  required: boolean;
}

export interface FormDataField {
  key: string;
  value: string;
  type: "text" | "file";
  required: boolean;
}

export interface URLData {
  baseURL: string;
  segments: string;
  queryParams: QueryParam[];
  segmentVariables: string[];
  processedURL?: string;
  description?: string;
  sessionDescription?: string;
}

export interface RequestConfigData {
  method: string;
  queryParams: QueryParam[];
  headers: Header[];
  bodyType: "none" | "json" | "form";
  jsonBody: string | null;
  formData: FormDataField[] | null;
}

export interface Variable {
  key: string;
  value: string;
}

export interface Session {
  id: string;
  name: string;
  timestamp: string;
  urlData?: URLData;
  requestConfig?: RequestConfigData;
  yamlOutput?: string;
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
  setUrlData: (data: URLData) => void;
  setRequestConfig: (config: RequestConfigData | null) => void;
  setYamlOutput: (yaml: string) => void;
  setActiveSection: (section: SectionId) => void;
  setSegmentVariables: (vars: Record<string, string>) => void;
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
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}
