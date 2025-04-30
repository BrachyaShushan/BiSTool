import { Session, Variable, URLData, RequestConfigData } from "./app.types";

export type ModalType = "new" | "rename" | "duplicate" | "edit";

export interface ExtendedSession extends Session {
  urlData: URLData;
  requestConfig: RequestConfigData;
  yamlOutput: string;
  segmentVariables: Record<string, string>;
  sharedVariables: Record<string, string>;
  activeSection: string;
}

export interface ExtendedVariable extends Variable {
  isGlobal: boolean;
  originalKey?: string;
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
