import { useState, useCallback, useMemo, useEffect } from "react";
import { ExtendedSession } from "../types/features/SavedManager";
import { URLData, RequestConfigData, Variable } from "../types";
import { DEFAULT_URL_DATA } from "../utils/storage";

// Custom event for opening session manager
const SESSION_MANAGER_EVENT = "openSessionManager";

// Type for session manager open options
export interface SessionManagerOpenOptions {
  tab?: "sessions" | "variables" | "projects";
}

// Custom hook for managing sessions
export const useSessionManager = () => {
  const [activeSession, setActiveSession] = useState<ExtendedSession | null>(
    null
  );
  const [savedSessions, setSavedSessions] = useState<ExtendedSession[]>([]);

  // Function to open session manager modal
  const openSessionManager = useCallback(
    (options?: SessionManagerOpenOptions) => {
      const event = new CustomEvent(SESSION_MANAGER_EVENT, {
        detail: options || { tab: "sessions" },
      });
      window.dispatchEvent(event);
    },
    []
  );

  // Function to listen for session manager open requests
  const useSessionManagerListener = useCallback(
    (callback: (options?: SessionManagerOpenOptions) => void) => {
      useEffect(() => {
        const handleOpenSessionManager = (event: CustomEvent) => {
          callback(event.detail);
        };

        window.addEventListener(
          SESSION_MANAGER_EVENT,
          handleOpenSessionManager as EventListener
        );

        return () => {
          window.removeEventListener(
            SESSION_MANAGER_EVENT,
            handleOpenSessionManager as EventListener
          );
        };
      }, [callback]);
    },
    []
  );

  // Create a new session from current app state (excluding activeSection - it should be global)
  const createSession = useCallback(
    (
      name: string,
      appState: {
        urlData: URLData;
        requestConfig: RequestConfigData | null;
        yamlOutput: string;
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

  // Set saved sessions and restore active session atomically
  const setSavedSessionsAndRestoreActive = useCallback(
    (sessions: ExtendedSession[], intendedActiveSessionId?: string | null) => {
      setSavedSessions(sessions);
      if (sessions.length > 0) {
        let sessionToActivate: ExtendedSession | null = null;
        if (intendedActiveSessionId) {
          sessionToActivate =
            sessions.find((s) => s.id === intendedActiveSessionId) || null;
        }
        if (!sessionToActivate) {
          sessionToActivate = sessions[0] || null;
        }
        setActiveSession(sessionToActivate);
      } else {
        setActiveSession(null);
      }
    },
    []
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
    setSavedSessionsAndRestoreActive,
    openSessionManager,
    useSessionManagerListener,
  };
};
