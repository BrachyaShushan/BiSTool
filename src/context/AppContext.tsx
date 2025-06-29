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
  TokenConfig,
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

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
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
    domain: "http://{base_url}",
    method: "POST",
    path: "/auth/login",
    tokenName: "x-access-token",
    headerKey: "x-access-token",
    headerValueFormat: "{token}",
    refreshToken: false,
    refreshTokenName: "refresh_token",

    // Enhanced authentication types
    authType: "bearer",

    // OAuth2 specific configuration
    oauth2: {
      grantType: "password",
      clientId: "",
      clientSecret: "",
      redirectUri: "",
      scope: "",
      authorizationUrl: "",
      tokenUrl: "",
      refreshUrl: "",
    },

    // API Key configuration
    apiKey: {
      keyName: "X-API-Key",
      keyValue: "",
      location: "header",
      prefix: "",
    },

    // Session-based authentication
    session: {
      sessionIdField: "session_id",
      sessionTokenField: "session_token",
      keepAlive: false,
      keepAliveInterval: 300,
    },

    // Enhanced extraction methods with priority and patterns
    extractionMethods: {
      json: false,
      jsonPaths: [],
      cookies: false,
      cookieNames: [],
      headers: false,
      headerNames: [],
      // New extraction methods
      regex: false,
      regexPatterns: [],
      xpath: false,
      xpathExpressions: [],
      css: false,
      cssSelectors: [],
      // Advanced JSON extraction with nested paths
      nestedJson: false,
      nestedPaths: [],
    },

    // Enhanced request mapping for different auth types
    requestMapping: {
      usernameField: "username",
      passwordField: "password",
      contentType: "form",
      // Additional fields for different auth types
      additionalFields: [],
      // Custom headers for the request
      customHeaders: [],
    },

    // Token validation and refresh configuration
    validation: {
      validateOnExtract: false,
      validationEndpoint: "",
      validationMethod: "GET",
      validationHeaders: [],
      autoRefresh: false,
      refreshThreshold: 5, // minutes before expiry
      maxRefreshAttempts: 3,
    },

    // Security and encryption
    security: {
      encryptToken: false,
      encryptionKey: "",
      hashToken: false,
      hashAlgorithm: "sha256",
      maskTokenInLogs: true,
    },

    // Error handling and fallback
    errorHandling: {
      retryOnFailure: true,
      maxRetries: 3,
      retryDelay: 1000,
      customErrorMessages: {},
    },
  });
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
    console.log(`AppContext: Reloading data for project ${currentProjectId}, forceReload: ${forceReload}, isInitialLoad: ${isInitialLoad}`);

    // Only load data if we have a current project
    if (!currentProjectId) {
      console.log("No current project ID, skipping data load");
      setIsLoading(false);
      return;
    }

    // Prevent multiple simultaneous loads
    if (isLoading && !isInitialLoad) {
      console.log("Already loading, skipping duplicate load");
      return;
    }

    // Set loading to true
    setIsLoading(true);

    // Only clear state if this is not the initial load (i.e., we're switching projects)
    if (!isInitialLoad) {
      console.log("Clearing state for project switch");

      // Clear all state synchronously with proper error handling
      try {
        setActiveSession(null);
        setSavedSessions([]);
        setGlobalVariables({});
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
        setActiveSection("url");
        setSegmentVariables({});
        setSharedVariables([]);
        console.log("State cleared successfully");
      } catch (error) {
        console.error("Error clearing state:", error);
        setIsLoading(false);
        return;
      }
    } else {
      console.log("Initial load - not clearing state");
      setIsInitialLoad(false);
    }

    // Use a small delay to ensure state clearing is processed before loading new data
    const loadData = () => {
      console.log("Loading data for project:", currentProjectId);

      // Verify we're still loading for the same project
      if (!currentProjectId) {
        console.log("Project changed during loading, aborting");
        setIsLoading(false);
        return;
      }

      // Verify the getProjectStorageKey function is working correctly
      const testKey = getProjectStorageKey("test");
      console.log(`Test storage key: ${testKey}, expected prefix: ${currentProjectId}`);

      if (!testKey.startsWith(currentProjectId)) {
        console.error("getProjectStorageKey is not working correctly!");
        console.error(`Expected: ${currentProjectId}_test, Got: ${testKey}`);
        setIsLoading(false);
        return;
      }

      // Reload active session
      try {
        const storageKey = getProjectStorageKey("active_session");
        console.log("Loading active session from:", storageKey);

        // Verify the storage key is for the current project
        if (!storageKey.startsWith(currentProjectId)) {
          console.log("Storage key mismatch, skipping session load");
          setActiveSession(null);
        } else {
          const savedSession = localStorage.getItem(storageKey);
          if (savedSession) {
            const parsed = safeParseJSON(savedSession);
            setActiveSession(parsed ?? null);
            console.log("Loaded active session:", parsed);
          } else {
            setActiveSession(null);
            console.log("No active session found");
          }
        }
      } catch (err) {
        setError("Failed to load active session Error: " + err);
        setActiveSession(null);
      }

      // Reload saved sessions
      try {
        const storageKey = getProjectStorageKey("saved_sessions");
        console.log("Loading saved sessions from:", storageKey);
        console.log("Current project ID:", currentProjectId);

        // Verify the storage key is for the current project
        if (!storageKey.startsWith(currentProjectId)) {
          console.log("Storage key mismatch, skipping sessions load");
          console.log("Expected prefix:", currentProjectId);
          console.log("Actual key:", storageKey);
          setSavedSessions([]);
        } else {
          const savedSessions = localStorage.getItem(storageKey);
          if (savedSessions) {
            const parsed = safeParseJSON(savedSessions);
            const sessions = Array.isArray(parsed) ? parsed : [];
            setSavedSessions(sessions);
            console.log("Loaded saved sessions:", sessions.length);
            console.log("Session names:", sessions.map(s => s.name));
          } else {
            setSavedSessions([]);
            console.log("No saved sessions found");
          }
        }
      } catch (err) {
        setError("Failed to load saved sessions Error: " + err);
        setSavedSessions([]);
      }

      // Reload global variables
      try {
        const storageKey = getProjectStorageKey("app_state");
        console.log("Loading app state from:", storageKey);

        // Verify the storage key is for the current project
        if (!storageKey.startsWith(currentProjectId)) {
          console.log("Storage key mismatch, skipping app state load");
          setGlobalVariables({});
        } else {
          const savedState = localStorage.getItem(storageKey);
          if (savedState) {
            const parsed = safeParseJSON(savedState);
            setGlobalVariables(parsed?.globalVariables ?? {});
            console.log("Loaded global variables:", Object.keys(parsed?.globalVariables ?? {}));
          } else {
            setGlobalVariables({});
            console.log("No app state found");
          }
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

      // Reload token config
      try {
        const storageKey = getProjectStorageKey("token_config");
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          const parsed = safeParseJSON(savedState);
          setTokenConfig(parsed ?? {
            domain: "http://{base_url}",
            method: "POST",
            path: "/auth/login",
            tokenName: "x-access-token",
            headerKey: "x-access-token",
            headerValueFormat: "{token}",
            refreshToken: false,
            refreshTokenName: "refresh_token",

            // Enhanced authentication types
            authType: "bearer",

            // OAuth2 specific configuration
            oauth2: {
              grantType: "password",
              clientId: "",
              clientSecret: "",
              redirectUri: "",
              scope: "",
              authorizationUrl: "",
              tokenUrl: "",
              refreshUrl: "",
            },

            // API Key configuration
            apiKey: {
              keyName: "X-API-Key",
              keyValue: "",
              location: "header",
              prefix: "",
            },

            // Session-based authentication
            session: {
              sessionIdField: "session_id",
              sessionTokenField: "session_token",
              keepAlive: false,
              keepAliveInterval: 300,
            },

            // Enhanced extraction methods with priority and patterns
            extractionMethods: {
              json: false,
              jsonPaths: [],
              cookies: false,
              cookieNames: [],
              headers: false,
              headerNames: [],
              // New extraction methods
              regex: false,
              regexPatterns: [],
              xpath: false,
              xpathExpressions: [],
              css: false,
              cssSelectors: [],
              // Advanced JSON extraction with nested paths
              nestedJson: false,
              nestedPaths: [],
            },

            // Enhanced request mapping for different auth types
            requestMapping: {
              usernameField: "username",
              passwordField: "password",
              contentType: "form",
              // Additional fields for different auth types
              additionalFields: [],
              // Custom headers for the request
              customHeaders: [],
            },

            // Token validation and refresh configuration
            validation: {
              validateOnExtract: false,
              validationEndpoint: "",
              validationMethod: "GET",
              validationHeaders: [],
              autoRefresh: false,
              refreshThreshold: 5, // minutes before expiry
              maxRefreshAttempts: 3,
            },

            // Security and encryption
            security: {
              encryptToken: false,
              encryptionKey: "",
              hashToken: false,
              hashAlgorithm: "sha256",
              maskTokenInLogs: true,
            },

            // Error handling and fallback
            errorHandling: {
              retryOnFailure: true,
              maxRetries: 3,
              retryDelay: 1000,
              customErrorMessages: {},
            }
          });
        } else {
          setTokenConfig({
            domain: "http://{base_url}",
            method: "POST",
            path: "/auth/login",
            tokenName: "x-access-token",
            headerKey: "x-access-token",
            headerValueFormat: "{token}",
            refreshToken: false,
            refreshTokenName: "refresh_token",

            // Enhanced authentication types
            authType: "bearer",

            // OAuth2 specific configuration
            oauth2: {
              grantType: "password",
              clientId: "",
              clientSecret: "",
              redirectUri: "",
              scope: "",
              authorizationUrl: "",
              tokenUrl: "",
              refreshUrl: "",
            },

            // API Key configuration
            apiKey: {
              keyName: "X-API-Key",
              keyValue: "",
              location: "header",
              prefix: "",
            },

            // Session-based authentication
            session: {
              sessionIdField: "session_id",
              sessionTokenField: "session_token",
              keepAlive: false,
              keepAliveInterval: 300,
            },

            // Enhanced extraction methods with priority and patterns
            extractionMethods: {
              json: false,
              jsonPaths: [],
              cookies: false,
              cookieNames: [],
              headers: false,
              headerNames: [],
              // New extraction methods
              regex: false,
              regexPatterns: [],
              xpath: false,
              xpathExpressions: [],
              css: false,
              cssSelectors: [],
              // Advanced JSON extraction with nested paths
              nestedJson: false,
              nestedPaths: [],
            },

            // Enhanced request mapping for different auth types
            requestMapping: {
              usernameField: "username",
              passwordField: "password",
              contentType: "form",
              // Additional fields for different auth types
              additionalFields: [],
              // Custom headers for the request
              customHeaders: [],
            },

            // Token validation and refresh configuration
            validation: {
              validateOnExtract: false,
              validationEndpoint: "",
              validationMethod: "GET",
              validationHeaders: [],
              autoRefresh: false,
              refreshThreshold: 5, // minutes before expiry
              maxRefreshAttempts: 3,
            },

            // Security and encryption
            security: {
              encryptToken: false,
              encryptionKey: "",
              hashToken: false,
              hashAlgorithm: "sha256",
              maskTokenInLogs: true,
            },

            // Error handling and fallback
            errorHandling: {
              retryOnFailure: true,
              maxRetries: 3,
              retryDelay: 1000,
              customErrorMessages: {},
            }
          });
        }
      } catch (err) {
        setError("Failed to load token config ERROR: " + err);
      }

      // Set loading to false after all data is loaded
      setIsLoading(false);
      setHasLoaded(true);
    }

    loadData();
  }, [currentProjectId, forceReload, isInitialLoad]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoaded) return;
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
    hasLoaded,
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
    if (!currentProjectId) return;
    const storageKey = getProjectStorageKey("token_config");
    localStorage.setItem(storageKey, JSON.stringify(tokenConfig));
  }, [tokenConfig, getProjectStorageKey, currentProjectId]);

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
        setYamlOutput(activeSession.yamlOutput ?? "");

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
    setGlobalVariables((prev) => {
      const updated = { ...prev, [key]: value };
      // Immediately persist to localStorage
      const storageKey = getProjectStorageKey("app_state");
      const savedState = localStorage.getItem(storageKey);
      const parsed = savedState ? safeParseJSON(savedState) ?? {} : {};
      parsed.globalVariables = updated;
      localStorage.setItem(storageKey, JSON.stringify(parsed));
      return updated;
    });
  };

  const deleteGlobalVariable = (key: string) => {
    setGlobalVariables((prev) => {
      const updated = { ...prev };
      delete updated[key];
      // Immediately persist to localStorage
      const storageKey = getProjectStorageKey("app_state");
      const savedState = localStorage.getItem(storageKey);
      const parsed = savedState ? safeParseJSON(savedState) ?? {} : {};
      parsed.globalVariables = updated;
      localStorage.setItem(storageKey, JSON.stringify(parsed));
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
      console.log('handleSaveSession called with name:', name, 'sessionData:', sessionData);

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

      console.log('Created new session:', newSession);

      // Validate session data
      if (!newSession.id || !newSession.name || !newSession.timestamp) {
        console.error('Invalid session data:', newSession);
        throw new Error("Invalid session data");
      }

      setSavedSessions((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === newSession.id);
        let updatedSessions;
        if (existingIndex >= 0) {
          updatedSessions = [...prev];
          updatedSessions[existingIndex] = newSession;
          console.log('Updated existing session at index:', existingIndex);
        } else {
          updatedSessions = [...prev, newSession];
          console.log('Adding new session to saved sessions');
        }

        // Save to localStorage immediately with the updated sessions
        const savedSessionsStorageKey = getProjectStorageKey("saved_sessions");
        console.log('Saving sessions to storage key:', savedSessionsStorageKey);
        console.log('Current project ID:', currentProjectId);
        localStorage.setItem(savedSessionsStorageKey, JSON.stringify(updatedSessions));
        console.log('Saved updated sessions to localStorage:', updatedSessions.length);

        return updatedSessions;
      });

      setActiveSession(newSession);
      console.log('Set active session:', newSession);

      // Save active session to localStorage immediately
      const activeSessionStorageKey = getProjectStorageKey("active_session");
      localStorage.setItem(activeSessionStorageKey, JSON.stringify(newSession));
      console.log('Saved active session to localStorage');
    },
    [
      urlData,
      requestConfig,
      yamlOutput,
      activeSection,
      segmentVariables,
      sharedVariables,
      getProjectStorageKey,
    ]
  );

  const handleDeleteSession = (id: string) => {
    setSavedSessions((prev) => {
      const updatedSessions = prev.filter((session) => session.id !== id);

      // Save to localStorage immediately with the updated sessions
      const savedSessionsStorageKey = getProjectStorageKey("saved_sessions");
      localStorage.setItem(savedSessionsStorageKey, JSON.stringify(updatedSessions));
      console.log('Saved updated sessions to localStorage after deletion:', updatedSessions.length);

      return updatedSessions;
    });

    if (activeSession?.id === id) {
      handleNewSession();
    }
  };

  const handleImportSessions = (sessions: any[]) => {
    const importedSessions: ExtendedSession[] = sessions.map((session, index) => {
      // Generate a unique ID if not provided
      const sessionId = session.id || `imported-${Date.now()}-${index}`;

      // Create a properly formatted session
      const importedSession: ExtendedSession = {
        id: sessionId,
        name: session.name || `Imported Session ${index + 1}`,
        timestamp: new Date().toISOString(),
        category: session.category || 'Imported',
        urlData: session.urlData || {
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
        requestConfig: session.requestConfig || {
          method: "GET",
          queryParams: [],
          headers: [],
          bodyType: "none",
          jsonBody: "",
          formData: [],
        },
        yamlOutput: session.yamlOutput || "",
        segmentVariables: session.segmentVariables || {},
        sharedVariables: session.sharedVariables || {},
        activeSection: session.activeSection || "url",
      };

      return importedSession;
    });

    // Add imported sessions to saved sessions
    setSavedSessions((prev) => {
      const updatedSessions = [...prev, ...importedSessions];

      // Save to localStorage immediately
      const savedSessionsStorageKey = getProjectStorageKey("saved_sessions");
      localStorage.setItem(savedSessionsStorageKey, JSON.stringify(updatedSessions));
      console.log('Saved imported sessions to localStorage:', importedSessions.length);

      return updatedSessions;
    });

    // Set the first imported session as active if no active session
    if (!activeSession && importedSessions.length > 0 && importedSessions[0]) {
      setActiveSession(importedSessions[0]);
      const activeSessionStorageKey = getProjectStorageKey("active_session");
      localStorage.setItem(activeSessionStorageKey, JSON.stringify(importedSessions[0]));
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

  const replaceVariables = (str: string): string => {
    if (!str) return str;
    return str.replace(/\{([^}]+)\}/g, (match, variableName) => {
      return globalVariables?.[variableName] || match;
    });
  };

  const regenerateToken = async (): Promise<void> => {
    try {
      if (!globalVariables['username'] || !globalVariables['password']) {
        throw new Error("Please set username and password in global variables");
      }

      // Evaluate all string fields in tokenConfig using replaceVariables
      const evaluatedTokenConfig = {
        ...tokenConfig,
        domain: replaceVariables(tokenConfig.domain || ""),
        path: replaceVariables(tokenConfig.path || ""),
        headerKey: replaceVariables(tokenConfig.headerKey || ""),
        headerValueFormat: replaceVariables(tokenConfig.headerValueFormat || ""),
        ...(tokenConfig.oauth2
          ? {
            oauth2: {
              ...tokenConfig.oauth2,
              clientId: replaceVariables(tokenConfig.oauth2.clientId || ""),
              clientSecret: replaceVariables(tokenConfig.oauth2.clientSecret || ""),
              redirectUri: replaceVariables(tokenConfig.oauth2.redirectUri || ""),
              scope: replaceVariables(tokenConfig.oauth2.scope || ""),
              authorizationUrl: replaceVariables(tokenConfig.oauth2.authorizationUrl || ""),
              tokenUrl: replaceVariables(tokenConfig.oauth2.tokenUrl || ""),
              ...(tokenConfig.oauth2.refreshUrl !== undefined && replaceVariables(tokenConfig.oauth2.refreshUrl || "")
                ? { refreshUrl: replaceVariables(tokenConfig.oauth2.refreshUrl || "") }
                : {}),
            },
          }
          : {}),
        ...(tokenConfig.apiKey
          ? {
            apiKey: {
              ...tokenConfig.apiKey,
              keyName: replaceVariables(tokenConfig.apiKey.keyName || ""),
              keyValue: replaceVariables(tokenConfig.apiKey.keyValue || ""),
              prefix: replaceVariables(tokenConfig.apiKey.prefix || ""),
            },
          }
          : {}),
        ...(tokenConfig.session
          ? {
            session: {
              ...tokenConfig.session,
              sessionIdField: replaceVariables(tokenConfig.session.sessionIdField || ""),
              sessionTokenField: replaceVariables(tokenConfig.session.sessionTokenField || ""),
            },
          }
          : {}),
      };

      // --- Use the same fetch logic as TokenGenerator ---
      const domain = evaluatedTokenConfig.domain;
      if (!domain) {
        throw new Error("Please set a valid domain");
      }
      const requestUrl = `${domain}${evaluatedTokenConfig.path}`;
      let requestBody: string;
      let contentType: string;
      if (evaluatedTokenConfig.requestMapping.contentType === "json") {
        const bodyData = {
          [evaluatedTokenConfig.requestMapping.usernameField]: globalVariables['username'],
          [evaluatedTokenConfig.requestMapping.passwordField]: globalVariables['password']
        };
        requestBody = JSON.stringify(bodyData);
        contentType = 'application/json';
      } else {
        requestBody = `${evaluatedTokenConfig.requestMapping.usernameField}=${encodeURIComponent(globalVariables['username'])}` +
          `&${evaluatedTokenConfig.requestMapping.passwordField}=${encodeURIComponent(globalVariables['password'])}`;
        contentType = 'application/x-www-form-urlencoded';
      }
      const response = await fetch(requestUrl, {
        method: evaluatedTokenConfig.method,
        headers: {
          'Accept': '*/*',
          'Content-Type': contentType,
        },
        body: requestBody,
      });
      let responseText = await response.text();
      let token: string | null = null;
      // Try to extract from JSON response first
      if (evaluatedTokenConfig.extractionMethods.json) {
        try {
          let jsonData: any;
          try {
            jsonData = JSON.parse(responseText);
          } catch (e) { }
          if (jsonData) {
            const defaultPaths = ['token', 'access_token', 'accessToken', 'jwt', 'auth_token'];
            const searchPaths = evaluatedTokenConfig.extractionMethods.jsonPaths.length > 0 ? evaluatedTokenConfig.extractionMethods.jsonPaths : defaultPaths;
            for (const path of searchPaths) {
              const value = jsonData[path];
              if (value && typeof value === 'string') {
                token = value;
                break;
              }
            }
          }
        } catch (e) { }
      }
      // Try to extract from cookies if JSON extraction failed
      if (!token && evaluatedTokenConfig.extractionMethods.cookies) {
        // Try to extract from Set-Cookie header directly
        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
          const cookies = setCookieHeader.split(',').map(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue?.trim().split('=') ?? [];
            return { name: name?.trim(), value: value?.trim() };
          });
          const defaultNames = ['token', 'access_token', 'auth_token', 'jwt'];
          const searchNames = evaluatedTokenConfig.extractionMethods.cookieNames.length > 0 ? evaluatedTokenConfig.extractionMethods.cookieNames : defaultNames;
          for (const cookieName of searchNames) {
            const cookie = cookies.find(c => c.name === cookieName);
            if (cookie?.value) {
              token = cookie.value;
              break;
            }
          }
          if (!token) {
            const tokenCookie = cookies.find(cookie =>
              cookie.name?.toLowerCase().includes('token') ||
              cookie.name?.toLowerCase().includes('auth') ||
              cookie.name?.toLowerCase().includes('jwt')
            );
            if (tokenCookie?.value) {
              token = tokenCookie.value;
            }
          }
        }
        // Try browser cookies if still not found
        if (!token) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const allCookies = document.cookie.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return { name: name?.trim(), value: value?.trim() };
          }).filter(cookie => cookie.name);
          const defaultNames = ['token', 'access_token', 'auth_token', 'jwt'];
          const searchNames = evaluatedTokenConfig.extractionMethods.cookieNames.length > 0 ? evaluatedTokenConfig.extractionMethods.cookieNames : defaultNames;
          for (const cookieName of searchNames) {
            const value = allCookies.find(c => c.name === cookieName)?.value;
            if (value) {
              token = value;
              break;
            }
          }
          if (!token) {
            const tokenCookie = allCookies.find(cookie =>
              cookie.name?.toLowerCase().includes('token') ||
              cookie.name?.toLowerCase().includes('auth') ||
              cookie.name?.toLowerCase().includes('jwt')
            );
            if (tokenCookie?.value) {
              token = tokenCookie.value;
            }
          }
        }
      }
      // Try to extract from response headers if previous methods failed
      if (!token && evaluatedTokenConfig.extractionMethods.headers) {
        const defaultNames = ['authorization', 'x-access-token', 'x-auth-token', 'token'];
        const searchNames = evaluatedTokenConfig.extractionMethods.headerNames.length > 0 ? evaluatedTokenConfig.extractionMethods.headerNames : defaultNames;
        for (const headerName of searchNames) {
          const value = response.headers.get(headerName);
          if (value) {
            token = value.replace(/^Bearer\s+/i, '');
            break;
          }
        }
      }
      // Try to extract from response text if previous methods failed
      if (!token && evaluatedTokenConfig.extractionMethods.cookies) {
        const jwtPattern = /jwt[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i;
        const match = responseText.match(jwtPattern);
        if (match) {
          token = match[1] ?? null;
        }
        if (!token) {
          const tokenPattern = /(?:token|access_token|auth_token)[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i;
          const tokenMatch = responseText.match(tokenPattern);
          if (tokenMatch) {
            token = tokenMatch[1] ?? null;
          }
        }
      }
      if (!token) {
        throw new Error("Token not found in response. Check your extraction configuration.");
      }
      updateGlobalVariable(evaluatedTokenConfig.tokenName, token);
      updateGlobalVariable("tokenName", evaluatedTokenConfig.tokenName);
      // Handle refresh token extraction
      if (evaluatedTokenConfig.refreshToken) {
        let refreshToken: string | null = null;
        if (evaluatedTokenConfig.extractionMethods.json && responseText) {
          try {
            const jsonData = JSON.parse(responseText);
            refreshToken = jsonData.refresh_token || jsonData.refreshToken;
          } catch (e) { }
        }
        if (!refreshToken && evaluatedTokenConfig.extractionMethods.cookies) {
          const allCookies = document.cookie.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return { name: name?.trim(), value: value?.trim() };
          }).filter(cookie => cookie.name);
          refreshToken = allCookies.find(c => c.name === evaluatedTokenConfig.refreshTokenName)?.value || null;
        }
        if (refreshToken) {
          updateGlobalVariable(evaluatedTokenConfig.refreshTokenName, refreshToken);
        }
      }
    } catch (error) {
      console.error("Token regeneration error:", error);
      throw error;
    }
  };

  // Generate authentication headers for API requests
  const generateAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};

    switch (tokenConfig.authType) {
      case 'bearer':
        const token = globalVariables[tokenConfig.tokenName];
        if (token) {
          const headerKey = tokenConfig.headerKey || 'Authorization';
          const headerValue = tokenConfig.headerValueFormat.replace('{token}', token);
          headers[headerKey] = headerValue;
        }
        break;

      case 'basic':
        const username = globalVariables['username'];
        const password = globalVariables['password'];
        if (username && password) {
          const credentials = btoa(`${username}:${password}`);
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;

      case 'oauth2':
        const oauthToken = globalVariables[tokenConfig.tokenName];
        if (oauthToken) {
          headers['Authorization'] = `Bearer ${oauthToken}`;
        }
        break;

      case 'api_key':
        const apiKey = tokenConfig.apiKey?.keyValue || globalVariables[tokenConfig.apiKey?.keyName || 'api_key'];
        if (apiKey) {
          const keyName = tokenConfig.apiKey?.keyName || 'X-API-Key';
          const prefix = tokenConfig.apiKey?.prefix || '';
          headers[keyName] = `${prefix}${apiKey}`;
        }
        break;

      case 'session':
        const sessionId = globalVariables[tokenConfig.session?.sessionIdField || 'session_id'];
        const sessionToken = globalVariables[tokenConfig.session?.sessionTokenField || 'session_token'];
        if (sessionId) {
          headers['Cookie'] = `${tokenConfig.session?.sessionIdField || 'session_id'}=${sessionId}`;
        }
        if (sessionToken) {
          headers['X-Session-Token'] = sessionToken;
        }
        break;

      case 'custom':
        // For custom auth, use the configured header key and value format
        const customToken = globalVariables[tokenConfig.tokenName];
        if (customToken) {
          const headerKey = tokenConfig.headerKey || 'Authorization';
          const headerValue = tokenConfig.headerValueFormat.replace('{token}', customToken);
          headers[headerKey] = headerValue;
        }
        break;
    }

    return headers;
  };

  // Get the current token value
  const getCurrentToken = (): string | null => {
    return globalVariables[tokenConfig.tokenName] || null;
  };

  // Check if authentication is configured
  const isAuthenticated = (): boolean => {
    const token = getCurrentToken();
    return !!token;
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
    tokenConfig,
    methodColor,
    isLoading,
    error,
    setUrlData,
    setRequestConfig,
    setYamlOutput,
    setActiveSection,
    setSegmentVariables,
    setTokenConfig,
    updateSharedVariable,
    deleteSharedVariable,
    updateGlobalVariable,
    updateSessionVariable,
    deleteSessionVariable,
    handleNewSession,
    handleLoadSession,
    handleSaveSession,
    handleDeleteSession,
    handleImportSessions,
    handleURLBuilderSubmit,
    handleRequestConfigSubmit,
    handleYAMLGenerated,
    deleteGlobalVariable,
    regenerateToken,
    generateAuthHeaders,
    getCurrentToken,
    isAuthenticated,
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
