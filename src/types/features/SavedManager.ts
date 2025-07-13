import { ResponseCondition } from "../core/app.types";

export interface ExtendedVariable {
  key: string;
  value: string;
  isGlobal: boolean;
  originalKey?: string;
}

export type ModalType = "new" | "edit" | "delete" | "rename" | "duplicate";

export interface ExtendedSession {
  id: string;
  name: string;
  timestamp: string;
  category?: string;
  urlData?: {
    baseURL: string;
    segments: string;
    parsedSegments: Array<{
      paramName: string;
      description?: string;
      required?: boolean;
      value: string;
      isDynamic: boolean;
    }>;
    queryParams: Array<{
      key: string;
      value: string;
      description?: string;
      required?: boolean;
      type?: string;
    }>;
    segmentVariables: Array<{
      key: string;
      value: string;
    }>;
    processedURL: string;
    domain: string;
    protocol: string;
    builtUrl: string;
    environment: string;
    sessionDescription?: string;
  };
  requestConfig?: {
    method: string;
    queryParams: Array<{
      key: string;
      value: string;
      description?: string;
      required?: boolean;
      type?: string;
    }>;
    headers: Array<{
      key: string;
      value: string;
      description?: string;
      required?: boolean;
      type?: string;
      in: "path" | "header" | "query";
    }>;
    bodyType: "none" | "json" | "form" | "text";
    jsonBody?: string;
    formData?: Array<{
      key: string;
      value: string;
      type: "text" | "file";
      required: boolean;
      description?: string;
    }>;
    textBody?: string;
  };
  yamlOutput?: string;
  segmentVariables?: Record<string, string>;
  sharedVariables?: Record<string, string>;
  activeSection?: string;
  responseConditions?: ResponseCondition[];
  includeToken?: boolean;
  requirements?: string;
  tests?: TestCase[];
  customResponse?: string;
}

export interface TestCase {
  id: string;
  name?: string;
  bodyOverride?: string;
  pathOverrides?: Record<string, string>;
  queryOverrides?: Record<string, string>;
  expectedStatus: string;
  expectedResponse?: string;
  expectedPartialResponse?: boolean;
  lastResult?: "pass" | "fail" | undefined;
  useToken?: boolean;
  serverResponse?: string;
  serverStatusCode?: number;
  includeInAIPrompt?: boolean;
}

export interface SavedManagerProps {
  activeSession: ExtendedSession | null;
  savedSessions: ExtendedSession[];
  globalVariables: Record<string, string>;
  handleLoadSession: (session: ExtendedSession) => void;
  handleSaveSession: (name: string, sessionData?: ExtendedSession) => void;
  handleDeleteSession: (id: string) => void;
  handleRenameSession: (id: string, newName: string) => void;
  updateGlobalVariable: (key: string, value: string) => void;
  deleteGlobalVariable: (key: string) => void;
  updateSessionVariable: (key: string, value: string) => void;
  deleteSessionVariable: (key: string) => void;
}
