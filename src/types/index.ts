import {
  URLData,
  RequestConfigData,
  Variable,
  SectionId,
  TokenConfig,
} from "./core/app.types";
import { ExtendedSession } from "./features/SavedManager";

export * from "./core/app.types";
export * from "./core/project.types";

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
  setSegmentVariables: (variables: Record<string, string>) => void;
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
  handleURLBuilderSubmit: (data: URLData) => void;
  handleRequestConfigSubmit: (config: RequestConfigData) => void;
  handleYAMLGenerated: (yaml: string) => void;
  deleteGlobalVariable: (key: string) => void;
}
