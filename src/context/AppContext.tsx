import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  AppContextType,
  URLData,
  RequestConfigData,
  Variable,
  SectionId,
} from "../types";
import { ExtendedSession } from "../types/features/SavedManager";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
  getProjectStorageKey: (key: string) => string;
  currentProjectId: string | null;
  forceReload: number;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, getProjectStorageKey, currentProjectId, forceReload }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with default values instead of trying to load from localStorage
  const [activeSession, setActiveSession] = useState<ExtendedSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<ExtendedSession[]>([]);
  const [globalVariables, setGlobalVariables] = useState<Record<string, string>>({});

  // Initialize state from localStorage if available
  const [urlData, setUrlData] = useState<URLData>({
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
  });

  const [requestConfig, setRequestConfig] = useState<RequestConfigData | null>(null);
  const [yamlOutput, setYamlOutput] = useState<string>("");
  const [activeSection, setActiveSection] = useState<SectionId>("url");
  const [segmentVariables, setSegmentVariables] = useState<Record<string, string>>({});
  const [sharedVariables, setSharedVariables] = useState<Variable[]>([]);
  const methodColor = {
    GET: { value: "GET", label: "GET", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" },
    POST: { value: "POST", label: "POST", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" },
    PUT: { value: "PUT", label: "PUT", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200" },
    DELETE: { value: "DELETE", label: "DELETE", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" },
    PATCH: { value: "PATCH", label: "PATCH", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" },
    HEAD: { value: "HEAD", label: "HEAD", color: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200" },
    OPTIONS: { value: "OPTIONS", label: "OPTIONS", color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200" },
  }
  // Effect to reload data when project changes
  useEffect(() => {
    // Only load data if we have a current project
    if (!currentProjectId) {
      console.log("No current project ID, skipping data load");
      setIsLoading(false);
      return;
    }

    console.log("Loading data for project:", currentProjectId);

    // Reload active session
    try {
      const storageKey = getProjectStorageKey("active_session");
      console.log("Loading active session from:", storageKey);
      const savedSession = localStorage.getItem(storageKey);
      if (savedSession) {
        const parsed = safeParseJSON(savedSession);
        setActiveSession(parsed ?? null);
        console.log("Loaded active session:", parsed);
      } else {
        setActiveSession(null);
        console.log("No active session found");
      }
    } catch (err) {
      setError("Failed to load active session Error: " + err);
      setActiveSession(null);
    }

    // Reload saved sessions
    try {
      const storageKey = getProjectStorageKey("saved_sessions");
      console.log("Loading saved sessions from:", storageKey);
      const savedSessions = localStorage.getItem(storageKey);
      if (savedSessions) {
        const parsed = safeParseJSON(savedSessions);
        const sessions = Array.isArray(parsed) ? parsed : [];
        setSavedSessions(sessions);
        console.log("Loaded saved sessions:", sessions.length);
      } else {
        setSavedSessions([]);
        console.log("No saved sessions found");
      }
    } catch (err) {
      setError("Failed to load saved sessions Error: " + err);
      setSavedSessions([]);
    }

    // Reload global variables
    try {
      const storageKey = getProjectStorageKey("app_state");
      console.log("Loading app state from:", storageKey);
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        setGlobalVariables(parsed?.globalVariables ?? {});
        console.log("Loaded global variables:", Object.keys(parsed?.globalVariables ?? {}));
      } else {
        setGlobalVariables({});
        console.log("No app state found");
      }
    } catch (err) {
      setError("Failed to load global variables Error: " + err);
      setGlobalVariables({});
    }

    // Reload URL data
    try {
      const storageKey = getProjectStorageKey("app_state");
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        setUrlData(parsed?.urlData ?? {
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
        });
      } else {
        setUrlData({
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
        });
      }
    } catch (err) {
      setError("Failed to load URL data Error: " + err);
      setUrlData({
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
      });
    }

    // Reload request config
    try {
      const storageKey = getProjectStorageKey("app_state");
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        setRequestConfig(parsed?.requestConfig ?? null);
      } else {
        setRequestConfig(null);
      }
    } catch (err) {
      setError("Failed to load request config Error: " + err);
      setRequestConfig(null);
    }

    // Reload YAML output
    try {
      const storageKey = getProjectStorageKey("app_state");
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        setYamlOutput(parsed?.yamlOutput ?? "");
      } else {
        setYamlOutput("");
      }
    } catch (err) {
      setError("Failed to load YAML output Error: " + err);
      setYamlOutput("");
    }

    // Reload active section
    try {
      const activeSessionStorageKey = getProjectStorageKey("active_session");
      const activeSessionStr = localStorage.getItem(activeSessionStorageKey);
      if (activeSessionStr) {
        const activeSession = safeParseJSON(activeSessionStr);
        if (activeSession?.activeSection) {
          setActiveSection(activeSession.activeSection as SectionId);
        }
      } else {
        const appStateStorageKey = getProjectStorageKey("app_state");
        const savedState = localStorage.getItem(appStateStorageKey);
        if (savedState) {
          const parsed = safeParseJSON(savedState);
          setActiveSection(parsed?.activeSection ?? "url");
        } else {
          setActiveSection("url");
        }
      }
    } catch (err) {
      setError("Failed to load active section ERROR: " + err);
      setActiveSection("url");
    }

    // Reload segment variables
    try {
      const storageKey = getProjectStorageKey("app_state");
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        setSegmentVariables(parsed?.segmentVariables ?? {});
      } else {
        setSegmentVariables({});
      }
    } catch (err) {
      setError("Failed to load segment variables ERROR: " + err);
      setSegmentVariables({});
    }

    // Reload shared variables
    try {
      const storageKey = getProjectStorageKey("shared_variables");
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        setSharedVariables(parsed ?? []);
      } else {
        setSharedVariables([]);
      }
    } catch (err) {
      setError("Failed to load shared variables ERROR: " + err);
      setSharedVariables([]);
    }

    // Set loading to false after all data is loaded
    setIsLoading(false);

  }, [currentProjectId, forceReload, getProjectStorageKey]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      const state = {
        urlData,
        requestConfig,
        yamlOutput,
        activeSection,
        segmentVariables,
        globalVariables,
      };
      const storageKey = getProjectStorageKey("app_state");
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (err) {
      setError("Failed to save app state ERROR: " + err);
    }
  }, [
    urlData,
    requestConfig,
    yamlOutput,
    activeSection,
    segmentVariables,
    globalVariables,
    getProjectStorageKey,
  ]);

  useEffect(() => {
    try {
      const storageKey = getProjectStorageKey("shared_variables");
      localStorage.setItem(storageKey, JSON.stringify(sharedVariables));
    } catch (err) {
      setError("Failed to save shared variables ERROR: " + err);
    }
  }, [sharedVariables, getProjectStorageKey]);

  useEffect(() => {
    try {
      const storageKey = getProjectStorageKey("active_session");
      localStorage.setItem(storageKey, JSON.stringify(activeSession));
    } catch (err) {
      setError("Failed to save active session ERROR: " + err);
    }
  }, [activeSession, getProjectStorageKey]);

  useEffect(() => {
    try {
      const storageKey = getProjectStorageKey("saved_sessions");
      localStorage.setItem(storageKey, JSON.stringify(savedSessions));
    } catch (err) {
      setError("Failed to save sessions ERROR: " + err);
    }
  }, [savedSessions, getProjectStorageKey]);

  // Effect to handle session changes and load configurations
  useEffect(() => {
    if (activeSession) {
      setIsLoading(true);
      try {
        // Load URL data
        setUrlData(
          activeSession.urlData || {
            baseURL: "",
            segments: "",
            parsedSegments: [],
            queryParams: [],
            segmentVariables: [],
            processedURL: "",
            domain: "",
            protocol: "http",
            builtUrl: "",
            environment: "development",
          }
        );

        // Load request config
        setRequestConfig(activeSession.requestConfig || null);

        // Load YAML output
        setYamlOutput(activeSession.yamlOutput || "");

        // Load segment variables
        setSegmentVariables(activeSession.segmentVariables || {});

        // Load shared variables
        setSharedVariables(
          Object.entries(activeSession.sharedVariables || {}).map(
            ([key, value]) => ({ key, value })
          )
        );

        // Set active section from session
        if (activeSession.activeSection) {
          setActiveSection(activeSession.activeSection as SectionId);
        }

        // Save the updated session
        const storageKey = getProjectStorageKey("active_session");
        localStorage.setItem(storageKey, JSON.stringify(activeSession));
      } catch (err) {
        setError("Failed to load session data ERROR: " + err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [activeSession?.id, getProjectStorageKey]);

  // Save active section to localStorage whenever it changes
  useEffect(() => {
    try {
      // Update app state
      const appStateStorageKey = getProjectStorageKey("app_state");
      const savedState = localStorage.getItem(appStateStorageKey);
      const state = savedState ? safeParseJSON(savedState) ?? {} : {};
      state.activeSection = activeSection;
      localStorage.setItem(appStateStorageKey, JSON.stringify(state));

      // Update active session if exists
      if (activeSession) {
        const updatedSession = {
          ...activeSession,
          activeSection,
        };
        const activeSessionStorageKey = getProjectStorageKey("active_session");
        localStorage.setItem(activeSessionStorageKey, JSON.stringify(updatedSession));
      }
    } catch (err) {
      setError("Failed to save active section ERROR: " + err);
    }
  }, [activeSection, activeSession, getProjectStorageKey]);

  const updateSharedVariable = (key: string, value: string) => {
    setSharedVariables((prev) => {
      const existingIndex = prev.findIndex((v) => v.key === key);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { key, value };
        return updated;
      }
      return [...prev, { key, value }];
    });
  };

  const deleteSharedVariable = (key: string) => {
    setSharedVariables((prev) => prev.filter((v) => v.key !== key));
  };

  const updateGlobalVariable = (key: string, value: string) => {
    setGlobalVariables((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const deleteGlobalVariable = (key: string) => {
    setGlobalVariables((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const updateSessionVariable = (key: string, value: string) => {
    if (activeSession) {
      const updatedSession = {
        ...activeSession,
        sharedVariables: {
          ...activeSession.sharedVariables,
          [key]: value,
        },
      };
      setActiveSession(updatedSession);
    }
  };

  const deleteSessionVariable = (key: string) => {
    if (activeSession) {
      const updatedSession = {
        ...activeSession,
        sharedVariables: {
          ...activeSession.sharedVariables,
        },
      };
      delete updatedSession.sharedVariables[key];
      setActiveSession(updatedSession);
    }
  };

  const handleNewSession = () => {
    setActiveSession(null);
    setUrlData({
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
    });
    setRequestConfig(null);
    setYamlOutput("");
    setSegmentVariables({});
    setSharedVariables([]);
    setActiveSection("url");
  };

  const handleLoadSession = (session: ExtendedSession) => {
    setActiveSession(session);
  };

  const handleSaveSession = useCallback(
    (name: string, sessionData?: ExtendedSession) => {
      const newSession: ExtendedSession = sessionData || {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name,
        timestamp: new Date().toISOString(),
        urlData: {
          ...urlData,
          parsedSegments: urlData.parsedSegments || [],
        },
        requestConfig: requestConfig || {
          method: "GET",
          queryParams: [],
          headers: [],
          bodyType: "none",
          jsonBody: "",
          formData: [],
        },
        yamlOutput: yamlOutput,
        segmentVariables: segmentVariables,
        sharedVariables: Object.fromEntries(
          sharedVariables.map((v) => [v.key, v.value])
        ),
        activeSection: activeSection,
      };

      // Validate session data
      if (!newSession.id || !newSession.name || !newSession.timestamp) {
        throw new Error("Invalid session data");
      }

      setSavedSessions((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === newSession.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newSession;
          return updated;
        }
        return [...prev, newSession];
      });

      setActiveSession(newSession);

      // Save to localStorage immediately
      const activeSessionStorageKey = getProjectStorageKey("active_session");
      const savedSessionsStorageKey = getProjectStorageKey("saved_sessions");
      localStorage.setItem(activeSessionStorageKey, JSON.stringify(newSession));
      localStorage.setItem(savedSessionsStorageKey, JSON.stringify(savedSessions));
    },
    [
      urlData,
      requestConfig,
      yamlOutput,
      activeSection,
      segmentVariables,
      sharedVariables,
      savedSessions,
      getProjectStorageKey,
    ]
  );

  const handleDeleteSession = (id: string) => {
    setSavedSessions((prev) => prev.filter((session) => session.id !== id));
    if (activeSession?.id === id) {
      handleNewSession();
    }
  };

  const handleURLBuilderSubmit = (data: URLData) => {
    setUrlData(data);
    // Automatically navigate to the next section (Request Config)
    setActiveSection("request");
  };

  const handleRequestConfigSubmit = (config: RequestConfigData) => {
    setRequestConfig(config);
    // Automatically navigate to the next section (Tests)
    setActiveSection("tests");
  };


  const handleYAMLGenerated = (yaml: string) => {
    setYamlOutput(yaml);
  };

  // Helper function to safely parse JSON
  const safeParseJSON = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      return null;
    }
  };

  const value: AppContextType = {
    urlData,
    requestConfig,
    yamlOutput,
    activeSection,
    segmentVariables,
    sharedVariables,
    activeSession,
    savedSessions,
    globalVariables,
    methodColor,
    isLoading,
    error,
    setUrlData,
    setRequestConfig,
    setYamlOutput,
    setActiveSection,
    setSegmentVariables,
    updateSharedVariable,
    deleteSharedVariable,
    updateGlobalVariable,
    updateSessionVariable,
    deleteSessionVariable,
    handleNewSession,
    handleLoadSession,
    handleSaveSession,
    handleDeleteSession,
    handleURLBuilderSubmit,
    handleRequestConfigSubmit,
    handleYAMLGenerated,
    deleteGlobalVariable,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
