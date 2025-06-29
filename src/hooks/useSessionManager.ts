import { useState, useCallback, useMemo } from "react";
import { ExtendedSession } from "../types/features/SavedManager";
import { URLData, RequestConfigData, SectionId, Variable } from "../types";
import { DEFAULT_URL_DATA } from "../utils/storage";

// Custom hook for managing sessions
export const useSessionManager = () => {
  const [activeSession, setActiveSession] = useState<ExtendedSession | null>(
    null
  );
  const [savedSessions, setSavedSessions] = useState<ExtendedSession[]>([]);

  // Create a new session from current app state
  const createSession = useCallback(
    (
      name: string,
      appState: {
        urlData: URLData;
        requestConfig: RequestConfigData | null;
        yamlOutput: string;
        activeSection: SectionId;
        segmentVariables: Record<string, string>;
        sharedVariables: Variable[];
      }
    ): ExtendedSession => {
      const newSession: ExtendedSession = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name,
        timestamp: new Date().toISOString(),
        urlData: appState.urlData,
        requestConfig: appState.requestConfig || {
          method: "GET",
          queryParams: [],
          headers: [],
          bodyType: "none",
          jsonBody: "",
          formData: [],
        },
        yamlOutput: appState.yamlOutput,
        segmentVariables: appState.segmentVariables,
        sharedVariables: Object.fromEntries(
          appState.sharedVariables.map((v) => [v.key, v.value])
        ),
        activeSection: appState.activeSection,
      };

      return newSession;
    },
    []
  );

  // Save a session
  const saveSession = useCallback((session: ExtendedSession) => {
    setSavedSessions((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === session.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = session;
        return updated;
      }
      return [...prev, session];
    });
  }, []);

  // Delete a session
  const deleteSession = useCallback(
    (id: string) => {
      setSavedSessions((prev) => prev.filter((session) => session.id !== id));

      // If the deleted session was active, clear active session
      if (activeSession?.id === id) {
        setActiveSession(null);
      }
    },
    [activeSession]
  );

  // Load a session
  const loadSession = useCallback((session: ExtendedSession) => {
    setActiveSession(session);
  }, []);

  // Import sessions
  const importSessions = useCallback(
    (sessions: any[]) => {
      const importedSessions: ExtendedSession[] = sessions.map(
        (session, index) => {
          const sessionId = session.id || `imported-${Date.now()}-${index}`;

          return {
            id: sessionId,
            name: session.name || `Imported Session ${index + 1}`,
            timestamp: new Date().toISOString(),
            category: session.category || "Imported",
            urlData: session.urlData || DEFAULT_URL_DATA,
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
        }
      );

      setSavedSessions((prev) => [...prev, ...importedSessions]);

      // Set the first imported session as active if no active session
      if (
        !activeSession &&
        importedSessions.length > 0 &&
        importedSessions[0]
      ) {
        setActiveSession(importedSessions[0]);
      }
    },
    [activeSession]
  );

  // Clear active session
  const clearActiveSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  // Get session by ID
  const getSessionById = useCallback(
    (id: string) => {
      return savedSessions.find((session) => session.id === id) || null;
    },
    [savedSessions]
  );

  // Memoized session names for quick access
  const sessionNames = useMemo(
    () =>
      savedSessions.map((session) => ({ id: session.id, name: session.name })),
    [savedSessions]
  );

  return {
    // State
    activeSession,
    savedSessions,
    sessionNames,

    // Actions
    createSession,
    saveSession,
    deleteSession,
    loadSession,
    importSessions,
    clearActiveSession,
    getSessionById,
    setSavedSessions,
  };
};
