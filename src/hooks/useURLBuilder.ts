import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import {
  Segment,
  isUrlDataEmpty,
  parseSegmentsFromString,
  parseSegmentsFromParsed,
  buildUrlFromSegments,
  createURLData,
} from "../utils/urlBuilderUtils";
import { DEFAULT_VALUES } from "../constants/urlBuilder";
import { useVariablesContext } from "../context/VariablesContext";

// Define a key for localStorage persistence
const LOCAL_STORAGE_KEY = "url_builder_state";

export interface UseURLBuilderOptions {
  autoSave?: boolean;
  persistToLocalStorage?: boolean;
}

export interface UseURLBuilderReturn {
  // State
  protocol: string;
  domain: string;
  segments: Segment[];
  sessionDescription: string;
  environment: string;
  builtUrl: string;
  copiedUrl: boolean;
  showPreview: boolean;

  // Actions
  setProtocol: (protocol: string) => void;
  setDomain: (domain: string) => void;
  setSegments: (segments: Segment[] | ((prev: Segment[]) => Segment[])) => void;
  setSessionDescription: (description: string) => void;
  setEnvironment: (environment: string) => void;
  setCopiedUrl: (copied: boolean) => void;
  setShowPreview: (show: boolean) => void;

  // Utility functions
  handleSegmentAdd: () => void;
  handleSegmentRemove: (index: number) => void;
  copyToClipboard: () => Promise<void>;
  getVariableValue: (paramName: string, env: string) => string | null;

  // Current URL data
  currentUrlData: ReturnType<typeof createURLData>;

  // State management
  reset: () => void;
  loadFromSession: () => void;
}

export const useURLBuilder = (
  options: UseURLBuilderOptions = {}
): UseURLBuilderReturn => {
  const { autoSave = true, persistToLocalStorage = true } = options;

  const { urlData, setUrlData, activeSession, handleSaveSession, isLoading } =
    useAppContext();
  const { globalVariables } = useVariablesContext();
  const { getVariableValue: getVariableValueFromContext } =
    useVariablesContext();
  // Refs to track state changes and prevent infinite loops
  const initializedSessionId = useRef<string | null>(null);
  const lastSyncedData = useRef<string>("");

  // Simple state without complex initialization
  const [protocol, setProtocol] = useState<string>(DEFAULT_VALUES.protocol);
  const [domain, setDomain] = useState<string>(DEFAULT_VALUES.domain);
  const [segments, setSegments] = useState<Segment[]>(DEFAULT_VALUES.segments);
  const [sessionDescription, setSessionDescription] = useState<string>(
    DEFAULT_VALUES.sessionDescription
  );
  const [environment, setEnvironment] = useState<string>(
    DEFAULT_VALUES.environment
  );
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Memoized built URL - automatically updates when dependencies change
  const builtUrl = useMemo(() => {
    return buildUrlFromSegments(
      protocol,
      domain,
      segments,
      globalVariables || {},
      getVariableValueFromContext
        ? (text: string) => {
            // Create a simple replaceVariables function using getVariableValueFromContext
            return text.replace(/\{([^}]+)\}/g, (match, varName) => {
              const value = getVariableValueFromContext(varName, environment);
              return value || match;
            });
          }
        : undefined
    );
  }, [
    protocol,
    domain,
    segments,
    globalVariables,
    getVariableValueFromContext,
    environment,
  ]);

  // Memoized URL data - automatically updates when local state changes
  const currentUrlData = useMemo(() => {
    return createURLData(
      protocol,
      domain,
      segments,
      sessionDescription,
      environment,
      builtUrl,
      urlData?.queryParams || []
    );
  }, [
    protocol,
    domain,
    segments,
    sessionDescription,
    environment,
    builtUrl,
    urlData?.queryParams,
  ]);

  const loadPersistedState = useCallback(() => {
    if (activeSession || !persistToLocalStorage) return null;

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, [activeSession, persistToLocalStorage]);

  const persistState = useCallback(
    (state: any) => {
      if (activeSession || !persistToLocalStorage) return;

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        // ignore
      }
    },
    [activeSession, persistToLocalStorage]
  );

  const getVariableValue = useCallback(
    (paramName: string, env: string) => {
      return getVariableValueFromContext(paramName, env);
    },
    [getVariableValueFromContext]
  );

  // Initialize state from data sources
  const initializeFromData = useCallback(() => {
    // Priority: activeSession > urlData > persisted > defaults
    if (activeSession?.urlData) {
      const sessionUrlData = activeSession.urlData;
      // Parse segments
      let parsedSegments: Segment[] = [];
      if (sessionUrlData.parsedSegments?.length > 0) {
        parsedSegments = parseSegmentsFromParsed(sessionUrlData.parsedSegments);
      } else if (sessionUrlData.segments) {
        parsedSegments = parseSegmentsFromString(sessionUrlData.segments);
      }

      // Resolve variable values for dynamic segments
      const resolvedSegments = parsedSegments.map((segment) => {
        if (segment.isDynamic && segment.paramName) {
          const resolvedValue = getVariableValue(
            segment.paramName,
            sessionUrlData.environment || DEFAULT_VALUES.environment
          );
          return {
            ...segment,
            value: resolvedValue || segment.value || "",
          };
        }
        return segment;
      });

      setSegments(resolvedSegments);
      setDomain(sessionUrlData.baseURL || DEFAULT_VALUES.domain);
      setProtocol(
        sessionUrlData.processedURL?.startsWith("https") ? "https" : "http"
      );
      setSessionDescription(
        sessionUrlData.sessionDescription || DEFAULT_VALUES.sessionDescription
      );
      setEnvironment(sessionUrlData.environment || DEFAULT_VALUES.environment);
    } else if (!isUrlDataEmpty(urlData) && urlData) {
      // Parse segments
      let parsedSegments: Segment[] = [];
      if (urlData.parsedSegments?.length > 0) {
        parsedSegments = parseSegmentsFromParsed(urlData.parsedSegments);
      } else if (urlData.segments) {
        parsedSegments = parseSegmentsFromString(urlData.segments);
      }

      // Resolve variable values for dynamic segments
      const resolvedSegments = parsedSegments.map((segment) => {
        if (segment.isDynamic && segment.paramName) {
          const resolvedValue = getVariableValue(
            segment.paramName,
            urlData.environment || DEFAULT_VALUES.environment
          );
          return {
            ...segment,
            value: resolvedValue || segment.value || "",
          };
        }
        return segment;
      });

      setSegments(resolvedSegments);
      setDomain(urlData.baseURL || DEFAULT_VALUES.domain);
      setProtocol(urlData.processedURL?.startsWith("https") ? "https" : "http");
      setSessionDescription(
        urlData.sessionDescription || DEFAULT_VALUES.sessionDescription
      );
      setEnvironment(urlData.environment || DEFAULT_VALUES.environment);
    } else {
      // Try to load from persisted state
      const persisted = loadPersistedState();
      if (persisted) {
        setProtocol(persisted.protocol || DEFAULT_VALUES.protocol);
        setDomain(persisted.domain || DEFAULT_VALUES.domain);
        setSegments(persisted.segments || DEFAULT_VALUES.segments);
        setSessionDescription(
          persisted.sessionDescription || DEFAULT_VALUES.sessionDescription
        );
        setEnvironment(persisted.environment || DEFAULT_VALUES.environment);
      }
    }
  }, [activeSession, urlData, loadPersistedState, getVariableValue]);

  // Reset to default values
  const reset = useCallback(() => {
    setProtocol(DEFAULT_VALUES.protocol);
    setDomain(DEFAULT_VALUES.domain);
    setSegments(DEFAULT_VALUES.segments);
    setSessionDescription(DEFAULT_VALUES.sessionDescription);
    setEnvironment(DEFAULT_VALUES.environment);
    setCopiedUrl(false);
    setShowPreview(true);
  }, []);

  // Load from active session
  const loadFromSession = useCallback(() => {
    if (activeSession) {
      initializeFromData();
    }
  }, [activeSession, initializeFromData]);

  // Event handlers
  const handleSegmentAdd = useCallback(() => {
    setSegments((prev) => [
      ...prev,
      {
        value: "",
        isDynamic: false,
        paramName: "",
        description: "",
        required: false,
      },
    ]);
  }, []);

  const handleSegmentRemove = useCallback((index: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(builtUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  }, [builtUrl]);

  // Single useEffect to handle initialization and session changes
  useEffect(() => {
    if (isLoading) return;

    const currentSessionId = activeSession?.id || null;

    // Initialize if we haven't yet, or if the session changed
    if (initializedSessionId.current !== currentSessionId) {
      initializedSessionId.current = currentSessionId;
      initializeFromData();
    }
  }, [isLoading, activeSession?.id, initializeFromData]);

  // Single useEffect to sync state with context and persist
  useEffect(() => {
    if (!autoSave) return;

    // Skip if we haven't initialized yet or if there's no meaningful data
    if (
      initializedSessionId.current === undefined ||
      (!segments.length && !domain)
    ) {
      return;
    }

    // Create a hash of current data to prevent unnecessary updates
    const currentDataHash = JSON.stringify({
      protocol,
      domain,
      segments,
      sessionDescription,
      environment,
      sessionId: activeSession?.id,
    });

    // Only proceed if data has actually changed
    if (lastSyncedData.current === currentDataHash) {
      return;
    }

    lastSyncedData.current = currentDataHash;

    // Update context
    setUrlData(currentUrlData);

    // Save to active session if exists
    if (activeSession) {
      const updatedSession = {
        ...activeSession,
        urlData: currentUrlData,
      };
      handleSaveSession(activeSession.name, updatedSession);
    } else {
      // Persist state if no active session
      persistState({
        protocol,
        domain,
        segments,
        sessionDescription,
        environment,
      });
    }
  }, [
    autoSave,
    protocol,
    domain,
    segments,
    sessionDescription,
    environment,
    activeSession,
    handleSaveSession,
    setUrlData,
    persistState,
    currentUrlData,
  ]);

  return {
    // State
    protocol,
    domain,
    segments,
    sessionDescription,
    environment,
    builtUrl,
    copiedUrl,
    showPreview,

    // Actions
    setProtocol,
    setDomain,
    setSegments,
    setSessionDescription,
    setEnvironment,
    setCopiedUrl,
    setShowPreview,

    // Utility functions
    handleSegmentAdd,
    handleSegmentRemove,
    copyToClipboard,
    getVariableValue,

    // Current URL data
    currentUrlData,

    // State management
    reset,
    loadFromSession,
  };
};
