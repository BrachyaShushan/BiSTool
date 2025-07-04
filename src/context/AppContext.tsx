import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  AppContextType,
  URLData,
  RequestConfigData,
  Variable,
} from "../types";
import { ExtendedSession } from "../types/features/SavedManager";
import { StorageManager } from "../utils/storage";
import { useAppState } from "../hooks/useAppState";
import { useSessionManager } from "../hooks/useSessionManager";
import { useTokenManager } from "../hooks/useTokenManager";
import { useAppStateStorage, useSessionStorage, useVariableStorage, useTokenConfigStorage } from "../hooks/useStorage";
import { useSaveManager } from "../hooks/useSaveManager";
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
  // Get current project name from ProjectContext
  const projectContext = useProjectContext();
  const projectName = projectContext?.currentProject?.name || "Unnamed Project";

  // Initialize storage manager
  const storageManager = useMemo(() => new StorageManager(), []);

  // Set current project in storage manager when it changes
  useEffect(() => {
    if (currentProjectId) {
      storageManager.setCurrentProject(currentProjectId);
    }
  }, [currentProjectId, storageManager]);

  // Initialize hooks
  const appState = useAppState();
  const sessionManager = useSessionManager();
  const tokenManager = useTokenManager(appState.globalVariables);

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
  const variableStorage = useVariableStorage(storageManager, currentProjectId, projectName);
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

        // Load shared variables
        const loadedSharedVariables = variableStorage.loadSharedVariables();
        appState.setSharedVariables(loadedSharedVariables);

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
            shared: loadedSharedVariables,
            global: loadedAppState.globalVariables
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
        shared: appState.sharedVariables,
        global: appState.globalVariables
      }
    };

    saveManager.autoSaveChanges(currentState);
  }, [appState.appState, sessionManager.activeSession, sessionManager.savedSessions, appState.sharedVariables, hasLoaded, saveManager]);

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
      if (appState.globalVariables) sessionData.globalVariables = appState.globalVariables;

      appState.loadAppState(sessionData);

      // Load shared variables from session
      const sessionVariables = Object.entries(session.sharedVariables || {}).map(
        ([key, value]) => ({ key, value })
      );
      appState.setSharedVariables(sessionVariables);
    }
  }, [sessionManager.activeSession?.id, hasLoaded]);

  // Variable management functions
  const updateSharedVariable = useCallback((key: string, value: string) => {
    appState.setSharedVariables((prev: Variable[]) => {
      const existingIndex = prev.findIndex((v: Variable) => v.key === key);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { key, value };
        return updated;
      }
      return [...prev, { key, value }];
    });
  }, []);

  const deleteSharedVariable = useCallback((key: string) => {
    appState.setSharedVariables((prev: Variable[]) => prev.filter((v: Variable) => v.key !== key));
  }, []);

  const updateGlobalVariable = useCallback((key: string, value: string) => {
    appState.setGlobalVariables((prev) => ({ ...prev, [key]: value }));
  }, []);

  const deleteGlobalVariable = useCallback((key: string) => {
    appState.setGlobalVariables((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, []);

  const updateSessionVariable = useCallback((key: string, value: string) => {
    if (sessionManager.activeSession) {
      const updatedSession = {
        ...sessionManager.activeSession,
        sharedVariables: {
          ...sessionManager.activeSession.sharedVariables,
          [key]: value,
        },
      };
      sessionManager.loadSession(updatedSession);
    }
  }, [sessionManager.activeSession]);

  const deleteSessionVariable = useCallback((key: string) => {
    if (sessionManager.activeSession) {
      const updatedSession = {
        ...sessionManager.activeSession,
        sharedVariables: {
          ...sessionManager.activeSession.sharedVariables,
        },
      };
      delete updatedSession.sharedVariables[key];
      sessionManager.loadSession(updatedSession);
    }
  }, [sessionManager.activeSession]);

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
    // Load shared variables from session
    const sessionVariables = Object.entries(session.sharedVariables || {}).map(
      ([key, value]) => ({ key, value })
    );
    appState.setSharedVariables(sessionVariables);
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
        sharedVariables: appState.sharedVariables,
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

  // Function to open session manager modal
  const openSessionManager = useCallback((options?: { tab?: 'sessions' | 'variables' | 'projects' }) => {
    sessionManager.openSessionManager(options);
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
        shared: appState.sharedVariables,
        global: appState.globalVariables
      }
    };
    await saveManager.manualSave(currentState);
  }, [appState.appState, sessionManager.activeSession, sessionManager.savedSessions, appState.sharedVariables, saveManager]);

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

      // Update variables
      appState.setSharedVariables(restoredState.variables.shared);
      appState.setGlobalVariables(restoredState.variables.global);
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

      // Update variables
      appState.setSharedVariables(restoredState.variables.shared);
      appState.setGlobalVariables(restoredState.variables.global);
    }
  }, [saveManager, appState, sessionManager]);

  const handleAutoSaveToggle = useCallback((enabled: boolean) => {
    saveManager.toggleAutoSave(enabled);
  }, [saveManager]);

  const value: AppContextType = {
    // App state
    urlData: appState.urlData,
    requestConfig: appState.requestConfig,
    yamlOutput: appState.yamlOutput,
    activeSection: appState.activeSection,
    segmentVariables: appState.segmentVariables,
    sharedVariables: appState.sharedVariables,
    globalVariables: appState.globalVariables,

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

    // Variable management
    updateSharedVariable,
    deleteSharedVariable,
    updateGlobalVariable,
    deleteGlobalVariable,
    updateSessionVariable,
    deleteSessionVariable,

    // Session management
    handleNewSession,
    handleLoadSession,
    handleSaveSession,
    handleDeleteSession,
    handleImportSessions,
    openSessionManager,

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
    setShowUnifiedManager,
    showUnifiedManager,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export { useAppContext };
