import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  AppContextType,
  URLData,
  RequestConfigData,
  TabType,
} from "../types";
import { ExtendedSession } from "../types/features/SavedManager";
import { useAppState } from "../hooks/useAppState";
import { useSessionManager } from "../hooks/useSessionManager";
import { useTokenManager } from "../hooks/useTokenManager";
import { useVariablesContext } from "./VariablesContext";
import { useSaveManager } from "../hooks/useSaveManager";
import { useAppStateStorage, useSessionStorage, useTokenConfigStorage } from "../hooks/useStorage";
import { useStorageContext } from "./StorageContext";
import { useProjectContext } from "./ProjectContext";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
  currentProjectId: string | null;
  forceReload: number;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, currentProjectId, forceReload }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const intendedActiveSessionId = useRef<string | null>(null);
  const [showUnifiedManager, setShowUnifiedManager] = useState(false);
  const [unifiedManagerTab, setUnifiedManagerTab] = useState<TabType>("projects");
  // Get current project name from ProjectContext
  const projectContext = useProjectContext();
  const projectName = projectContext?.currentProject?.name || "Unnamed Project";

  // Use the shared StorageManager from StorageContext
  const { storageManager } = useStorageContext();

  // Initialize hooks
  const appState = useAppState();
  const sessionManager = useSessionManager();
  const tokenManager = useTokenManager();
  const {
    updateGlobalVariable,
    sharedVariables,
  } = useVariablesContext();

  // Initialize save manager
  const saveManager = useSaveManager(storageManager, projectName, {
    autoSaveEnabled: true,
    autoSaveDelay: 300,
    maxUndoHistory: 20,
    projectId: currentProjectId
  });

  // Initialize storage hooks with projectId and projectName
  const appStateStorage = useAppStateStorage(storageManager, appState.appState, currentProjectId, projectName);
  const sessionStorage = useSessionStorage(storageManager, currentProjectId, projectName);
  const tokenConfigStorage = useTokenConfigStorage(storageManager, currentProjectId, projectName);

  // Method color mapping
  const methodColor = {
    GET: { value: "GET", label: "GET", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" },
    POST: { value: "POST", label: "POST", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" },
    PUT: { value: "PUT", label: "PUT", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200" },
    DELETE: { value: "DELETE", label: "DELETE", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" },
    PATCH: { value: "PATCH", label: "PATCH", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" },
    HEAD: { value: "HEAD", label: "HEAD", color: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200" },
    OPTIONS: { value: "OPTIONS", label: "OPTIONS", color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200" },
  };

  // Load data when project changes
  useEffect(() => {
    if (!currentProjectId) {
      setIsLoading(false);
      return;
    }

    const loadProjectData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load app state
        const loadedAppState = appStateStorage.loadAppState();
        appState.loadAppState(loadedAppState);

        // Load sessions (saved first, then active)
        const loadedSavedSessions = sessionStorage.loadSavedSessions();
        const loadedActiveSession = sessionStorage.loadActiveSession();
        intendedActiveSessionId.current = loadedActiveSession?.id || null;
        sessionManager.setSavedSessionsAndRestoreActive(
          loadedSavedSessions,
          intendedActiveSessionId.current
        );

        // Load shared variables - now handled by VariablesContext

        // Load token config
        const loadedTokenConfig = tokenConfigStorage.loadTokenConfig();
        if (loadedTokenConfig) {
          tokenManager.setTokenConfig(loadedTokenConfig);
        }

        // Initialize save manager with loaded state
        saveManager.initialize({
          appState: loadedAppState,
          sessions: {
            activeSession: loadedActiveSession,
            savedSessions: loadedSavedSessions
          },
          variables: {
            shared: [],
            global: {}
          }
        });

        setHasLoaded(true);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load project data:", err);
        setError(`Failed to load project data: ${err}`);
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [currentProjectId, forceReload, projectName]);

  // Auto-save when app state changes (using new save manager)
  useEffect(() => {
    if (!hasLoaded) return;

    const currentState = {
      appState: appState.appState,
      sessions: {
        activeSession: sessionManager.activeSession,
        savedSessions: sessionManager.savedSessions
      },
      variables: {
        shared: [],
        global: {}
      }
    };

    saveManager.autoSaveChanges(currentState);
  }, [appState.appState, sessionManager.activeSession, sessionManager.savedSessions, hasLoaded, saveManager]);

  // Auto-save when token config changes
  useEffect(() => {
    if (!hasLoaded || !currentProjectId) return;
    tokenConfigStorage.saveTokenConfig(tokenManager.tokenConfig);
  }, [tokenManager.tokenConfig, hasLoaded, currentProjectId, projectName]);

  // Handle session changes and load configurations
  useEffect(() => {
    if (sessionManager.activeSession && hasLoaded) {
      const session = sessionManager.activeSession;

      // Load session data into app state (excluding activeSection - it should persist globally)
      const sessionData: any = {};
      if (session.urlData) sessionData.urlData = session.urlData;
      if (session.requestConfig !== undefined) sessionData.requestConfig = session.requestConfig;
      if (session.yamlOutput !== undefined) sessionData.yamlOutput = session.yamlOutput;
      // Remove activeSection from session loading - it should be global, not per-session
      if (session.segmentVariables) sessionData.segmentVariables = session.segmentVariables;

      appState.loadAppState(sessionData);

      // Session variables are now handled by VariablesContext through the active session
    }
  }, [sessionManager.activeSession?.id, hasLoaded]);

  // Function to update session variables in the active session
  const updateSessionVariables = useCallback((sessionVariables: Record<string, string>) => {
    if (sessionManager.activeSession) {
      const updatedSession = {
        ...sessionManager.activeSession,
        sharedVariables: sessionVariables
      };
      sessionManager.saveSession(updatedSession);
      sessionManager.loadSession(updatedSession);
    }
  }, [sessionManager]);

  // Variable management functions
  // Session variable management now handled by VariablesContext

  // Session management functions
  const handleNewSession = useCallback(() => {
    sessionManager.clearActiveSession();
    appState.resetAppState();
  }, []);

  const handleLoadSession = useCallback((session: ExtendedSession) => {
    sessionManager.loadSession(session);
    // Only update app state fields that are part of the session (excluding activeSection)
    const sessionData: any = {};
    if (session.urlData) sessionData.urlData = session.urlData;
    if (session.requestConfig !== undefined) sessionData.requestConfig = session.requestConfig;
    if (session.yamlOutput !== undefined) sessionData.yamlOutput = session.yamlOutput;
    // Don't load activeSection from session - it should remain at the global app level
    if (session.segmentVariables) sessionData.segmentVariables = session.segmentVariables;
    // DO NOT set globalVariables here!
    appState.loadAppState(sessionData);
    // Shared variables are now handled by VariablesContext
  }, []);

  const handleSaveSession = useCallback((name: string, sessionData?: ExtendedSession) => {
    if (sessionData) {
      sessionManager.saveSession(sessionData);
      sessionManager.loadSession(sessionData);
    } else {
      const newSession = sessionManager.createSession(name, {
        urlData: appState.urlData,
        requestConfig: appState.requestConfig,
        yamlOutput: appState.yamlOutput,
        // Don't save activeSection with sessions - it should be global
        segmentVariables: appState.segmentVariables,
        sharedVariables,
      });
      sessionManager.saveSession(newSession);
      sessionManager.loadSession(newSession);
    }
  }, [appState.appState]);

  const handleDeleteSession = useCallback((id: string) => {
    sessionManager.deleteSession(id);
  }, []);

  const handleImportSessions = useCallback((sessions: any[]) => {
    sessionManager.importSessions(sessions);
  }, []);

  // Workflow handlers
  const handleURLBuilderSubmit = useCallback((data: URLData) => {
    appState.setUrlData(data);
    appState.setActiveSection("request");
  }, []);

  const handleRequestConfigSubmit = useCallback((config: RequestConfigData) => {
    appState.setRequestConfig(config);
    appState.setActiveSection("tests");
  }, []);

  const handleYAMLGenerated = useCallback((yaml: string) => {
    appState.setYamlOutput(yaml);
  }, []);

  // Token management functions
  const regenerateToken = useCallback(async (): Promise<void> => {
    try {
      const result = await tokenManager.regenerateToken();
      updateGlobalVariable(result.tokenName, result.token);
      updateGlobalVariable("tokenName", result.tokenName);

      if (result.refreshToken && result.refreshTokenName) {
        updateGlobalVariable(result.refreshTokenName, result.refreshToken);
      }
    } catch (error) {
      console.error("Token regeneration error:", error);
      throw error;
    }
  }, [tokenManager, updateGlobalVariable]);

  const generateAuthHeaders = useCallback(() => {
    return tokenManager.generateAuthHeaders();
  }, [tokenManager]);

  const getCurrentToken = useCallback(() => {
    return tokenManager.getCurrentToken();
  }, [tokenManager]);

  const isAuthenticated = useCallback(() => {
    return tokenManager.isAuthenticated();
  }, [tokenManager]);

  // Save management functions
  const handleManualSave = useCallback(async () => {
    const currentState = {
      appState: appState.appState,
      sessions: {
        activeSession: sessionManager.activeSession,
        savedSessions: sessionManager.savedSessions
      },
      variables: {
        shared: [],
        global: {}
      }
    };
    await saveManager.manualSave(currentState);
  }, [appState.appState, sessionManager.activeSession, sessionManager.savedSessions, saveManager]);

  const handleUndo = useCallback(() => {
    const restoredState = saveManager.undo();
    if (restoredState) {
      // Update app state
      appState.loadAppState(restoredState.appState);

      // Update sessions
      sessionManager.setSavedSessionsAndRestoreActive(
        restoredState.sessions.savedSessions,
        restoredState.sessions.activeSession?.id || null
      );

      // Update variables - now handled by VariablesContext
    }
  }, [saveManager, appState, sessionManager]);

  const handleRedo = useCallback(() => {
    const restoredState = saveManager.redo();
    if (restoredState) {
      // Update app state
      appState.loadAppState(restoredState.appState);

      // Update sessions
      sessionManager.setSavedSessionsAndRestoreActive(
        restoredState.sessions.savedSessions,
        restoredState.sessions.activeSession?.id || null
      );

      // Update variables - now handled by VariablesContext
    }
  }, [saveManager, appState, sessionManager]);

  const handleAutoSaveToggle = useCallback((enabled: boolean) => {
    saveManager.toggleAutoSave(enabled);
  }, [saveManager]);
  const openUnifiedManager = useCallback((initialTab?: TabType) => {
    if (initialTab) {
      setUnifiedManagerTab(initialTab);
    }
    setShowUnifiedManager(true);
  }, []);
  const value: AppContextType = {
    // App state
    urlData: appState.urlData,
    requestConfig: appState.requestConfig,
    yamlOutput: appState.yamlOutput,
    activeSection: appState.activeSection,
    segmentVariables: appState.segmentVariables,

    // Session state
    activeSession: sessionManager.activeSession,
    savedSessions: sessionManager.savedSessions,

    // Token state
    tokenConfig: tokenManager.tokenConfig,

    // UI state
    methodColor,
    isLoading,
    error,

    // App state setters
    setUrlData: appState.setUrlData,
    setRequestConfig: appState.setRequestConfig,
    setYamlOutput: appState.setYamlOutput,
    setActiveSection: appState.setActiveSection,
    setSegmentVariables: appState.setSegmentVariables,
    setTokenConfig: tokenManager.setTokenConfig,

    // Session management
    handleNewSession,
    handleLoadSession,
    handleSaveSession,
    handleDeleteSession,
    handleImportSessions,

    // Workflow handlers
    handleURLBuilderSubmit,
    handleRequestConfigSubmit,
    handleYAMLGenerated,

    // Token management
    regenerateToken,
    generateAuthHeaders,
    getCurrentToken,
    isAuthenticated,

    // Save management
    autoSave: saveManager.autoSave,
    isSaving: saveManager.isSaving,
    lastSaved: saveManager.lastSaved,
    hasUnsavedChanges: saveManager.hasUnsavedChanges,
    saveFrequency: saveManager.saveFrequency,
    manualSave: handleManualSave,
    undo: handleUndo,
    redo: handleRedo,
    toggleAutoSave: handleAutoSaveToggle,
    updateSaveFrequency: saveManager.updateSaveFrequency,
    isUndoAvailable: saveManager.isUndoAvailable,
    isRedoAvailable: saveManager.isRedoAvailable,

    // Unified Manager
    showUnifiedManager,
    setShowUnifiedManager,
    unifiedManagerTab,
    openUnifiedManager,

    // Session variables
    updateSessionVariables,
  };

  return <AppContext value={value}>{children}</AppContext>;
};

function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

export { useAppContext };
