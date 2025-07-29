import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
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
import { useNavigate, useParams } from "react-router-dom";

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

  // Ref to store the latest saveAllData function
  const saveAllDataRef = useRef<((state: any) => void) | null>(null);

  // Unified save function that handles both basic and project modes
  const saveAllData = useCallback((state: {
    appState: any;
    sessions: any;
    variables: any;
  }) => {
    if (currentProjectId) {
      // Project mode - use storage manager
      storageManager.updateAppState(state.appState, projectName);
      storageManager.updateSessions(state.sessions, projectName);
      storageManager.updateVariables(state.variables, projectName);
    } else {
      // Basic mode - save directly to localStorage
      try {
        // Save active session
        if (state.sessions.activeSession) {
          localStorage.setItem('activeSession', JSON.stringify(state.sessions.activeSession));
        }
        // Save saved sessions
        if (state.sessions.savedSessions.length > 0) {
          localStorage.setItem('savedSessions', JSON.stringify(state.sessions.savedSessions));
        }
        // Save app state
        localStorage.setItem('appState', JSON.stringify(state.appState));
        // Note: Mode is saved separately to prevent infinite loops
        console.log('AppContext: Basic mode unified save completed');
      } catch (error) {
        console.error('AppContext: Error saving to localStorage:', error);
      }
    }
  }, [currentProjectId, storageManager, projectName]);

  // Update the ref whenever saveAllData changes
  useEffect(() => {
    saveAllDataRef.current = saveAllData;
  }, [saveAllData]);

  // Memoize save manager options to prevent infinite loops
  const saveManagerOptions = useMemo(() => ({
    autoSaveEnabled: true,
    autoSaveDelay: 300,
    maxUndoHistory: 20,
    projectId: currentProjectId,
    unifiedSaveFunction: saveAllData
  }), [currentProjectId, saveAllData]);

  // Initialize save manager
  const saveManager = useSaveManager(storageManager, projectName, saveManagerOptions);

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
      // Basic mode - load data from localStorage
      console.log('AppContext: Loading basic mode data from localStorage');
      setIsLoading(true);
      setError(null);

      try {
        // Load active session from localStorage
        const activeSessionData = localStorage.getItem('activeSession');
        const loadedActiveSession = activeSessionData ? JSON.parse(activeSessionData) : null;

        // Load saved sessions from localStorage
        const savedSessionsData = localStorage.getItem('savedSessions');
        const loadedSavedSessions = savedSessionsData ? JSON.parse(savedSessionsData) : [];

        // Load app state from localStorage
        const appStateData = localStorage.getItem('appState');
        const loadedAppState = appStateData ? JSON.parse(appStateData) : null;

        // Load mode setting from localStorage
        const modeData = localStorage.getItem('bistool_mode');
        const loadedMode = modeData ? JSON.parse(modeData) : 'expert';

        console.log('AppContext: Basic mode loaded data:', {
          activeSession: loadedActiveSession?.id,
          savedSessionsCount: loadedSavedSessions.length,
          hasAppState: !!loadedAppState,
          mode: loadedMode
        });

        // Load app state if available
        if (loadedAppState) {
          appState.loadAppState(loadedAppState);
        }

        // Load sessions
        if (loadedActiveSession) {
          intendedActiveSessionId.current = loadedActiveSession.id;
        }
        sessionManager.setSavedSessionsAndRestoreActive(
          loadedSavedSessions,
          intendedActiveSessionId.current
        );

        // Load mode setting
        setMode(loadedMode);

        // Initialize save manager with loaded state
        const currentState = {
          appState: loadedAppState || appState.appState,
          sessions: {
            activeSession: loadedActiveSession,
            savedSessions: loadedSavedSessions
          },
          variables: {
            shared: [],
            global: {}
          }
        };
        saveManager.initialize(currentState);

        setHasLoaded(true);
        setIsLoading(false);
        console.log('AppContext: Basic mode loading completed');
      } catch (err) {
        console.error("Failed to load basic mode data:", err);
        setError(`Failed to load basic mode data: ${err}`);
        setIsLoading(false);
      }

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
    console.log('AppContext: Auto-save effect check', {
      hasLoaded,
      currentProjectId,
      willRun: hasLoaded || !currentProjectId,
      timestamp: Date.now()
    });

    if (!hasLoaded && currentProjectId) return;

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

    console.log('AppContext: Auto-save effect triggered', {
      hasLoaded,
      currentProjectId,
      activeSession: sessionManager.activeSession?.id,
      urlData: sessionManager.activeSession?.urlData,
      requestConfig: sessionManager.activeSession?.requestConfig,
      timestamp: Date.now()
    });

    saveManager.autoSaveChanges(currentState);

    // Use unified save function instead of separate storage calls
    if (saveAllDataRef.current) {
      saveAllDataRef.current(currentState);
    }
  }, [
    appState.appState,
    sessionManager.activeSession,
    sessionManager.savedSessions,
    // Add more specific dependencies to detect session content changes
    sessionManager.activeSession?.urlData,
    sessionManager.activeSession?.requestConfig,
    sessionManager.activeSession?.yamlOutput,
    sessionManager.activeSession?.sharedVariables,
    sessionManager.activeSession?.segmentVariables,
    hasLoaded,
    currentProjectId
  ]);

  // Re-initialize save manager when app is loaded to ensure proper state tracking
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

    // Re-initialize the save manager with current state to ensure proper tracking
    saveManager.initialize(currentState);
    console.log('AppContext: Re-initialized save manager with current state');
  }, [hasLoaded]);

  // Auto-save when mode changes (works for both basic and project modes)
  useEffect(() => {
    if (!hasLoaded) return;

    if (currentProjectId) {
      // Project mode - use mode storage
      modeStorage.saveMode(mode);
    } else {
      // Basic mode - save mode to localStorage
      try {
        localStorage.setItem('bistool_mode', JSON.stringify(mode));
        console.log('AppContext: Basic mode - saved mode setting:', mode);
      } catch (error) {
        console.error('AppContext: Error saving mode to localStorage:', error);
      }
    }
  }, [mode, hasLoaded, currentProjectId, modeStorage]);

  // Auto-save request configuration changes to active session
  useEffect(() => {
    if (!hasLoaded || !sessionManager.activeSession || !appState.requestConfig) return;

    console.log('AppContext: Request config changed, saving to active session:', {
      sessionId: sessionManager.activeSession.id,
      method: appState.requestConfig.method,
      bodyType: appState.requestConfig.bodyType,
      headersCount: appState.requestConfig.headers?.length || 0,
      queryParamsCount: appState.requestConfig.queryParams?.length || 0,
      hasJsonBody: !!appState.requestConfig.jsonBody,
      hasFormData: !!appState.requestConfig.formData,
      hasTextBody: !!appState.requestConfig.textBody,
      timestamp: Date.now()
    });

    const updatedSession = {
      ...sessionManager.activeSession,
      requestConfig: appState.requestConfig
    };

    // Save the updated session without reloading it to prevent circular dependencies
    sessionManager.saveSession(updatedSession);
    console.log('AppContext: Session saved via sessionManager');

    // Also persist to localStorage in basic mode
    if (!currentProjectId) {
      try {
        localStorage.setItem('activeSession', JSON.stringify(updatedSession));
        console.log('AppContext: Request config saved to localStorage');
      } catch (error) {
        console.error('AppContext: Error saving request config to localStorage:', error);
      }
    }
  }, [appState.requestConfig, hasLoaded, sessionManager.activeSession?.id, currentProjectId]);

  // Handle session changes and load configurations
  useEffect(() => {
    console.log('AppContext: Session change effect triggered:', sessionManager.activeSession?.id, 'hasLoaded:', hasLoaded);
    if (sessionManager.activeSession && hasLoaded) {
      const session = sessionManager.activeSession;
      console.log('AppContext: Processing session change for session:', session.id, 'sharedVariables:', session.sharedVariables);
      console.log('AppContext: Session request config:', {
        method: session.requestConfig?.method,
        bodyType: session.requestConfig?.bodyType,
        headersCount: session.requestConfig?.headers?.length || 0,
        queryParamsCount: session.requestConfig?.queryParams?.length || 0,
        hasJsonBody: !!session.requestConfig?.jsonBody,
        hasFormData: !!session.requestConfig?.formData,
        hasTextBody: !!session.requestConfig?.textBody
      });

      // Load session data into app state
      const sessionData: any = {};
      if (session.urlData) sessionData.urlData = session.urlData;
      if (session.requestConfig !== undefined) sessionData.requestConfig = session.requestConfig;
      if (session.yamlOutput !== undefined) sessionData.yamlOutput = session.yamlOutput;
      if (session.segmentVariables) sessionData.segmentVariables = session.segmentVariables;

      console.log('AppContext: Loading session data into app state:', sessionData);
      appState.loadAppState(sessionData);

      // Session variables are now handled by VariablesContext through the active session
    }
  }, [sessionManager.activeSession?.id, hasLoaded, sessionManager.savedSessions.length]);

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
  const navigate = useNavigate();
  const params = useParams();
  const projectIdFromUrl = params["projectId"] || currentProjectId;
  const sessionIdFromUrl = params["sessionId"];
  const sectionFromUrl = params["section"] || "url";

  // Track last processed session ID to prevent unnecessary re-runs
  const lastProcessedSessionId = useRef<string | null>(null);

  // Always use URL params to set current project/session
  useEffect(() => {
    // Only switch project after initial data loading is complete
    if (!hasLoaded) return;

    if (projectIdFromUrl && projectContext?.projects) {
      const project = projectContext.projects.find(p => p.id === projectIdFromUrl);
      if (project && projectContext.currentProject?.id !== projectIdFromUrl) {
        console.log('AppContext: Switching project from URL:', projectIdFromUrl, 'current:', projectContext.currentProject?.id);
        projectContext.switchProject(projectIdFromUrl);
      }
    }
    // No else: let ProjectProvider handle no project case
  }, [projectIdFromUrl, projectContext, hasLoaded]);

  useEffect(() => {
    // Only load session from URL after initial data loading is complete
    if (!hasLoaded) {
      console.log('AppContext: Session loading effect skipped - data not loaded yet');
      return;
    }

    // Skip if we've already processed this session ID
    if (lastProcessedSessionId.current === sessionIdFromUrl) {
      return;
    }

    console.log('AppContext: Session loading effect triggered', {
      sessionIdFromUrl,
      savedSessionsCount: sessionManager.savedSessions.length,
      currentActiveSession: sessionManager.activeSession?.id,
      hasLoaded
    });

    if (sessionIdFromUrl && sessionManager.savedSessions.length > 0) {
      const session = sessionManager.savedSessions.find(s => s.id === sessionIdFromUrl);
      if (session && sessionManager.activeSession?.id !== sessionIdFromUrl) {
        console.log('AppContext: Loading session from URL:', sessionIdFromUrl, 'current:', sessionManager.activeSession?.id);
        sessionManager.loadSession(session);

        // Also update app state to match the loaded session
        const sessionData: any = {};
        if (session.urlData) sessionData.urlData = session.urlData;
        if (session.requestConfig !== undefined) sessionData.requestConfig = session.requestConfig;
        if (session.yamlOutput !== undefined) sessionData.yamlOutput = session.yamlOutput;
        if (session.segmentVariables) sessionData.segmentVariables = session.segmentVariables;
        appState.loadAppState(sessionData);

        // Mark this session as processed
        lastProcessedSessionId.current = sessionIdFromUrl;
      } else if (!session) {
        console.log('AppContext: Session not found in savedSessions:', sessionIdFromUrl);
        lastProcessedSessionId.current = sessionIdFromUrl;
      } else {
        // Session is already active, no need to load
        console.log('AppContext: Session already active, no need to load:', sessionIdFromUrl);
        lastProcessedSessionId.current = sessionIdFromUrl;
      }
    } else if (sessionIdFromUrl && sessionManager.savedSessions.length === 0) {
      console.log('AppContext: No saved sessions available, cannot load:', sessionIdFromUrl);
      lastProcessedSessionId.current = sessionIdFromUrl;
    }
    // No else: let sessionManager handle no session case
  }, [sessionIdFromUrl, sessionManager.savedSessions.length, hasLoaded]);

  // Reset last processed session ID when saved sessions change
  useEffect(() => {
    lastProcessedSessionId.current = null;
  }, [sessionManager.savedSessions.length]);

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

    // Navigate to the new session URL
    if (projectIdFromUrl && newSession.id) {
      navigate(`/project/${projectIdFromUrl}/session/${newSession.id}/url`);
    }
  }, [sessionManager, appState, sessionStorage, projectIdFromUrl, navigate]);

  const handleClearSession = useCallback(() => {
    sessionManager.clearActiveSession();
    appState.resetAppState();
  }, [sessionManager, appState]);

  const handleLoadSession = useCallback((session: ExtendedSession) => {
    sessionManager.loadSession(session);

    // Also persist the loaded session as active session to localStorage
    sessionStorage.saveActiveSession(session);

    // Load session data into app state
    const sessionData: any = {};
    if (session.urlData) sessionData.urlData = session.urlData;
    if (session.requestConfig !== undefined) sessionData.requestConfig = session.requestConfig;
    if (session.yamlOutput !== undefined) sessionData.yamlOutput = session.yamlOutput;
    if (session.segmentVariables) sessionData.segmentVariables = session.segmentVariables;
    // DO NOT set globalVariables here!
    appState.loadAppState(sessionData);
    // Shared variables are now handled by VariablesContext

    // Navigate to the session URL, keep current section if possible
    if (projectIdFromUrl && session.id) {
      navigate(`/project/${projectIdFromUrl}/session/${session.id}/${sectionFromUrl}`);
    }
  }, [sessionManager, sessionStorage, appState, projectIdFromUrl, sectionFromUrl, navigate]);

  const handleSaveSession = useCallback((name: string, sessionData?: ExtendedSession, preventNavigation?: boolean) => {
    let sessionToUse = sessionData;
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

        segmentVariables: appState.segmentVariables,
        sharedVariables: [], // Session variables are handled by VariablesContext
      });
      sessionManager.saveSession(newSession);
      sessionManager.loadSession(newSession);

      // Also persist the new session to localStorage
      sessionStorage.saveActiveSession(newSession);
      sessionStorage.saveSavedSessions(sessionManager.savedSessions);
      sessionToUse = newSession;
    }
    // Navigate to the session URL only if navigation is not prevented
    if (!preventNavigation && projectIdFromUrl && sessionToUse?.id) {
      navigate(`/project/${projectIdFromUrl}/session/${sessionToUse.id}/${sectionFromUrl}`);
    }
  }, [appState.appState, sessionManager, sessionStorage, projectIdFromUrl, sectionFromUrl, navigate]);

  const handleDeleteSession = useCallback((id: string) => {
    sessionManager.deleteSession(id);
  }, []);

  const handleImportSessions = useCallback((sessions: any[]) => {
    sessionManager.importSessions(sessions);
  }, []);

  // Workflow handlers
  const handleURLBuilderSubmit = useCallback((data: URLData) => {
    appState.setUrlData(data);
    // Navigate to request config page
    if (projectIdFromUrl && sessionIdFromUrl) {
      navigate(`/project/${projectIdFromUrl}/session/${sessionIdFromUrl}/request`);
    }
  }, [projectIdFromUrl, sessionIdFromUrl, navigate]);

  const handleRequestConfigSubmit = useCallback((config: RequestConfigData) => {
    appState.setRequestConfig(config);
    // Navigate to tests page
    if (projectIdFromUrl && sessionIdFromUrl) {
      navigate(`/project/${projectIdFromUrl}/session/${sessionIdFromUrl}/tests`);
    }
  }, [projectIdFromUrl, sessionIdFromUrl, navigate]);

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
  }, [saveManager, appState]);

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
  }, [saveManager, appState]);

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
  const value: AppContextType = useMemo(() => ({
    // App state
    urlData: appState.urlData,
    requestConfig: appState.requestConfig,
    yamlOutput: appState.yamlOutput,
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
  }), [
    appState.urlData,
    appState.requestConfig,
    appState.yamlOutput,
    appState.segmentVariables,
    sessionManager.activeSession,
    sessionManager.savedSessions,
    methodColor,
    isLoading,
    error,
    mode,
    handleSetMode,
    appState.setUrlData,
    appState.setRequestConfig,
    appState.setYamlOutput,
    appState.setSegmentVariables,
    handleNewSession,
    handleClearSession,
    handleLoadSession,
    handleSaveSession,
    handleDeleteSession,
    handleImportSessions,
    handleURLBuilderSubmit,
    handleRequestConfigSubmit,
    handleYAMLGenerated,
    saveManager.autoSave,
    saveManager.isSaving,
    saveManager.lastSaved,
    saveManager.hasUnsavedChanges,
    saveManager.saveFrequency,
    handleManualSave,
    handleUndo,
    handleRedo,
    handleAutoSaveToggle,
    saveManager.updateSaveFrequency,
    saveManager.isUndoAvailable,
    saveManager.isRedoAvailable,
    showUnifiedManager,
    setShowUnifiedManager,
    unifiedManagerTab,
    openUnifiedManager,
    updateSessionVariables
  ]);

  return <AppContext value={value}>{children}</AppContext>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
