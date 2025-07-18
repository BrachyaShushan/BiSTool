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
import { useSaveManager } from "../hooks/useSaveManager";
import { useAppStateStorage, useSessionStorage, useModeStorage } from "../hooks/useStorage";
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
  const [mode, setMode] = useState<'basic' | 'expert'>('expert');
  // Get current project name from ProjectContext
  const projectContext = useProjectContext();
  const projectName = projectContext?.currentProject?.name || "Unnamed Project";

  // Use the shared StorageManager from StorageContext
  const { storageManager } = useStorageContext();

  // Initialize hooks
  const appState = useAppState();
  const sessionManager = useSessionManager();

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
  const modeStorage = useModeStorage(storageManager, currentProjectId, projectName);

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
      // Notify ProjectContext that loading is complete when no project is selected
      if (projectContext?.setProjectLoadingComplete) {
        projectContext.setProjectLoadingComplete();
      }
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
        console.log('AppContext: Loaded active session from storage:', loadedActiveSession?.id, loadedActiveSession?.sharedVariables);
        intendedActiveSessionId.current = loadedActiveSession?.id || null;
        sessionManager.setSavedSessionsAndRestoreActive(
          loadedSavedSessions,
          intendedActiveSessionId.current
        );

        // Load shared variables - now handled by VariablesContext

        // Load mode setting
        const loadedMode = modeStorage.loadMode();
        setMode(loadedMode);

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
        // Notify ProjectContext that loading is complete
        if (projectContext?.setProjectLoadingComplete) {
          projectContext.setProjectLoadingComplete();
        }
      } catch (err) {
        console.error("Failed to load project data:", err);
        setError(`Failed to load project data: ${err}`);
        setIsLoading(false);
        // Notify ProjectContext that loading failed
        if (projectContext?.setProjectLoadingComplete) {
          projectContext.setProjectLoadingComplete();
        }
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

  // Auto-save when mode changes
  useEffect(() => {
    if (!hasLoaded || !currentProjectId) return;
    modeStorage.saveMode(mode);
  }, [mode, hasLoaded, currentProjectId, projectName, modeStorage]);

  // Handle session changes and load configurations
  useEffect(() => {
    console.log('AppContext: Session change effect triggered:', sessionManager.activeSession?.id, 'hasLoaded:', hasLoaded);
    if (sessionManager.activeSession && hasLoaded) {
      const session = sessionManager.activeSession;
      console.log('AppContext: Processing session change for session:', session.id, 'sharedVariables:', session.sharedVariables);

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
    console.log('AppContext: updateSessionVariables called with:', sessionVariables);
    if (sessionManager.activeSession) {
      const updatedSession = {
        ...sessionManager.activeSession,
        sharedVariables: sessionVariables
      };
      console.log('AppContext: Updated session:', updatedSession);
      sessionManager.saveSession(updatedSession);
      sessionManager.loadSession(updatedSession);

      // Also persist the updated session to localStorage
      sessionStorage.saveActiveSession(updatedSession);
      // Get the updated saved sessions list and save it
      const updatedSavedSessions = sessionManager.savedSessions.map(session =>
        session.id === updatedSession.id ? updatedSession : session
      );
      sessionStorage.saveSavedSessions(updatedSavedSessions);
      console.log('AppContext: Session variables saved to localStorage');
    }
  }, [sessionManager, sessionStorage]);

  // Variable management functions
  // Session variable management now handled by VariablesContext

  // Session management functions
  const handleNewSession = useCallback(() => {
    // Create a new session with default values
    const newSession = sessionManager.createSession("New Session", {
      urlData: {
        baseURL: "",
        segments: "",
        parsedSegments: [],
        queryParams: [],
        segmentVariables: [],
        processedURL: "",
        domain: "",
        protocol: "https",
        builtUrl: "",
        environment: "development",
      },
      requestConfig: {
        method: "GET",
        queryParams: [],
        headers: [],
        bodyType: "none",
        jsonBody: "{\n  \n}",
        formData: [],
      },
      yamlOutput: "",
      segmentVariables: {},
      sharedVariables: [],
    });

    // Save and load the new session
    sessionManager.saveSession(newSession);
    sessionManager.loadSession(newSession);

    // Also persist the new session to localStorage
    sessionStorage.saveActiveSession(newSession);
    sessionStorage.saveSavedSessions(sessionManager.savedSessions);

    // Reset app state to match the new session
    appState.resetAppState();
  }, [sessionManager, appState]);

  const handleClearSession = useCallback(() => {
    sessionManager.clearActiveSession();
    appState.resetAppState();
  }, [sessionManager, appState]);

  const handleLoadSession = useCallback((session: ExtendedSession) => {
    sessionManager.loadSession(session);

    // Also persist the loaded session as active session to localStorage
    sessionStorage.saveActiveSession(session);

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
  }, [sessionManager, sessionStorage, appState]);

  const handleSaveSession = useCallback((name: string, sessionData?: ExtendedSession) => {
    if (sessionData) {
      sessionManager.saveSession(sessionData);
      sessionManager.loadSession(sessionData);

      // Also persist the session to localStorage
      sessionStorage.saveActiveSession(sessionData);
      const updatedSavedSessions = sessionManager.savedSessions.map(session =>
        session.id === sessionData.id ? sessionData : session
      );
      sessionStorage.saveSavedSessions(updatedSavedSessions);
    } else {
      const newSession = sessionManager.createSession(name, {
        urlData: appState.urlData,
        requestConfig: appState.requestConfig,
        yamlOutput: appState.yamlOutput,
        // Don't save activeSection with sessions - it should be global
        segmentVariables: appState.segmentVariables,
        sharedVariables: [], // Session variables are handled by VariablesContext
      });
      sessionManager.saveSession(newSession);
      sessionManager.loadSession(newSession);

      // Also persist the new session to localStorage
      sessionStorage.saveActiveSession(newSession);
      sessionStorage.saveSavedSessions(sessionManager.savedSessions);
    }
  }, [appState.appState, sessionManager, sessionStorage]);

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

  // Custom setMode function that also saves the mode
  const handleSetMode = useCallback((newMode: 'basic' | 'expert') => {
    setMode(newMode);
    // The mode will be auto-saved by the useEffect above
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

    // UI state
    methodColor,
    isLoading,
    error,

    // Mode state
    mode,
    setMode: handleSetMode,

    // App state setters
    setUrlData: appState.setUrlData,
    setRequestConfig: appState.setRequestConfig,
    setYamlOutput: appState.setYamlOutput,
    setActiveSection: appState.setActiveSection,
    setSegmentVariables: appState.setSegmentVariables,

    // Session management
    handleNewSession,
    handleClearSession,
    handleLoadSession,
    handleSaveSession,
    handleDeleteSession,
    handleImportSessions,

    // Workflow handlers
    handleURLBuilderSubmit,
    handleRequestConfigSubmit,
    handleYAMLGenerated,



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

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
