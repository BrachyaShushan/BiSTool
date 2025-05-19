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
import { ExtendedSession } from "../types/SavedManager";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<ExtendedSession | null>(() => {
    try {
      const savedSession = localStorage.getItem("active_session");
      if (savedSession) {
        const parsed = safeParseJSON(savedSession);
        return parsed ?? null;
      }
      return null;
    } catch (err) {
      setError("Failed to load active session Error: " + err);
      return null;
    }
  });

  const [savedSessions, setSavedSessions] = useState<ExtendedSession[]>(() => {
    try {
      const savedSessions = localStorage.getItem("saved_sessions");
      if (savedSessions) {
        const parsed = safeParseJSON(savedSessions);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (err) {
      setError("Failed to load saved sessions Error: " + err);
      return [];
    }
  });

  const [globalVariables, setGlobalVariables] = useState<Record<string, string>>(() => {
    try {
      const savedState = localStorage.getItem("app_state");
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        return parsed?.globalVariables ?? {};
      }
      return {};
    } catch (err) {
      setError("Failed to load global variables Error: " + err);
      return {};
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from localStorage if available
  const [urlData, setUrlData] = useState<URLData>(() => {
    try {
      const savedState = localStorage.getItem("app_state");
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        return (
          parsed?.urlData ?? {
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
          }
        );
      }
      return {
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
      };
    } catch (err) {
      setError("Failed to load URL data Error: " + err);
      return {
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
      };
    }
  });

  const [requestConfig, setRequestConfig] = useState<RequestConfigData | null>(
    () => {
      try {
        const savedState = localStorage.getItem("app_state");
        if (savedState) {
          const parsed = safeParseJSON(savedState);
          return parsed?.requestConfig ?? null;
        }
        return null;
      } catch (err) {
        setError("Failed to load request config Error: " + err);
        return null;
      }
    }
  );

  const [yamlOutput, setYamlOutput] = useState<string>(() => {
    try {
      const savedState = localStorage.getItem("app_state");
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        return parsed?.yamlOutput ?? "";
      }
      return "";
    } catch (err) {
      setError("Failed to load YAML output Error: " + err);
      return "";
    }
  });

  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    try {
      // First try to get from active session
      const activeSessionStr = localStorage.getItem("active_session");
      if (activeSessionStr) {
        const activeSession = safeParseJSON(activeSessionStr);
        if (activeSession?.activeSection) {
          return activeSession.activeSection as SectionId;
        }
      }

      // Then try to get from app state
      const savedState = localStorage.getItem("app_state");
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        return parsed?.activeSection ?? "url";
      }
      return "url";
    } catch (err) {
      setError("Failed to load active section ERROR: " + err);
      return "url";
    }
  });

  const [segmentVariables, setSegmentVariables] = useState<
    Record<string, string>
  >(() => {
    try {
      const savedState = localStorage.getItem("app_state");
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        return parsed?.segmentVariables ?? {};
      }
      return {};
    } catch (err) {
      setError("Failed to load segment variables ERROR: " + err);
      return {};
    }
  });

  const [sharedVariables, setSharedVariables] = useState<Variable[]>(() => {
    try {
      const savedState = localStorage.getItem("shared_variables");
      if (savedState) {
        const parsed = safeParseJSON(savedState);
        return parsed ?? [];
      }
      return [];
    } catch (err) {
      setError("Failed to load shared variables ERROR: " + err);
      return [];
    }
  });

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
      localStorage.setItem("app_state", JSON.stringify(state));
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
  ]);

  useEffect(() => {
    try {
      localStorage.setItem("shared_variables", JSON.stringify(sharedVariables));
    } catch (err) {
      setError("Failed to save shared variables ERROR: " + err);
    }
  }, [sharedVariables]);

  useEffect(() => {
    try {
      localStorage.setItem("active_session", JSON.stringify(activeSession));
    } catch (err) {
      setError("Failed to save active session ERROR: " + err);
    }
  }, [activeSession]);

  useEffect(() => {
    try {
      localStorage.setItem("saved_sessions", JSON.stringify(savedSessions));
    } catch (err) {
      setError("Failed to save sessions ERROR: " + err);
    }
  }, [savedSessions]);

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
            queryParams: [],
            segmentVariables: [],
            processedURL: "",
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
        localStorage.setItem("active_session", JSON.stringify(activeSession));
      } catch (err) {
        setError("Failed to load session data ERROR: " + err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [activeSession?.id]); // Only run when session ID changes

  // Save active section to localStorage whenever it changes
  useEffect(() => {
    try {
      // Update app state
      const savedState = localStorage.getItem("app_state");
      const state = savedState ? safeParseJSON(savedState) ?? {} : {};
      state.activeSection = activeSection;
      localStorage.setItem("app_state", JSON.stringify(state));

      // Update active session if exists
      if (activeSession) {
        const updatedSession = {
          ...activeSession,
          activeSection,
        };
        localStorage.setItem("active_session", JSON.stringify(updatedSession));
      }
    } catch (err) {
      setError("Failed to save active section ERROR: " + err);
    }
  }, [activeSection, activeSession]);

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

  const updateSessionVariable = (key: string, value: string) => {
    if (activeSession) {
      const updatedSession: ExtendedSession = {
        ...activeSession,
        sharedVariables: {
          ...activeSession.sharedVariables,
          [key]: value,
        },
      };
      setActiveSession(updatedSession);
      handleSaveSession(activeSession.name, updatedSession);
    }
  };

  const handleNewSession = () => {
    try {
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
      setActiveSection("url");
    } catch (error) {
      console.error("Error creating new session:", error);
    }
  };

  const handleLoadSession = (session: ExtendedSession) => {
    try {
      if (!session || typeof session !== "object") {
        throw new Error("Invalid session data");
      }

      // Validate required session properties
      const requiredProps = ["id", "name", "timestamp"];
      const missingProps = requiredProps.filter((prop) => !(prop in session));
      if (missingProps.length > 0) {
        throw new Error(
          `Missing required session properties: ${missingProps.join(", ")}`
        );
      }

      setActiveSession(session);
      setUrlData(
        session.urlData || {
          baseURL: "",
          segments: "",
          queryParams: [],
          segmentVariables: [],
          processedURL: "",
        }
      );
      setRequestConfig(session.requestConfig || null);
      setYamlOutput(session.yamlOutput || "");
      setSegmentVariables(session.segmentVariables || {});
      setSharedVariables(
        Object.entries(session.sharedVariables || {}).map(([key, value]) => ({
          key,
          value,
        }))
      );
      setActiveSection((session.activeSection as SectionId) || "url");
    } catch (err) {
      setError("Failed to load session ERROR: " + err);
    }
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
      localStorage.setItem("active_session", JSON.stringify(newSession));
      localStorage.setItem("saved_sessions", JSON.stringify(savedSessions));
    },
    [
      urlData,
      requestConfig,
      yamlOutput,
      activeSection,
      segmentVariables,
      sharedVariables,
      savedSessions,
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
    setActiveSection("request");
  };

  const handleRequestConfigSubmit = (config: RequestConfigData) => {
    setRequestConfig(config);
    setActiveSection("yaml");
  };

  const handleYAMLGenerated = (yaml: string) => {
    setYamlOutput(yaml);
    setActiveSection("ai");
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
    handleNewSession,
    handleLoadSession,
    handleSaveSession,
    handleDeleteSession,
    handleURLBuilderSubmit,
    handleRequestConfigSubmit,
    handleYAMLGenerated,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export { AppContext };

// Helper function to safely parse JSON
const safeParseJSON = (str: string): any => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};
