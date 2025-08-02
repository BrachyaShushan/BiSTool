import {
  ResponseCondition,
  URLData,
  RequestConfigData,
  TestCase as SharedTestCase,
} from "@/types/shared";
import { ModalType } from "@/types/core/common.types";

export interface ExtendedVariable {
  key: string;
  value: string;
  isGlobal: boolean;
  originalKey?: string;
}

// Re-export ModalType for backward compatibility
export type { ModalType };

export interface ExtendedSession {
  id: string;
  name: string;
  timestamp: string;
  category?: string;
  urlData?: URLData;
  requestConfig?: RequestConfigData;
  yamlOutput?: string;
  segmentVariables?: Record<string, string>;
  sharedVariables?: Record<string, string>;
  activeSection?: string;
  responseConditions?: ResponseCondition[];
  includeToken?: boolean;
  requirements?: string;
  tests?: SharedTestCase[];
  customResponse?: string;
}

export interface TestCase extends SharedTestCase {
  // Additional properties specific to this feature if needed
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
