import { useCallback, useRef, useEffect, useState } from "react";
import { StorageManager, ProjectData } from "../utils/storage";

// Debounce utility
const useDebounce = function <T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for storage operations with debouncing
export const useStorage = (
  storageManager: StorageManager,
  projectId: string | null
) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set the current project for the storage manager
  useEffect(() => {
    storageManager.setCurrentProject(projectId);
  }, [storageManager, projectId]);

  // Debounced save function
  const debouncedSave = useCallback(
    (saveFn: () => void, delay: number = 300) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        try {
          saveFn();
        } catch (error) {
          console.error("Storage save error:", error);
        }
      }, delay);
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    debouncedSave,
    storageManager,
  };
};

// Hook for managing app state with automatic saving
export const useAppStateStorage = (
  storageManager: StorageManager,
  state: ProjectData["appState"],
  projectId: string | null,
  projectName: string
) => {
  const { debouncedSave } = useStorage(storageManager, projectId);

  // Debounce the state to avoid excessive saves
  const debouncedState = useDebounce(state, 500);

  // Auto-save when state changes
  useEffect(() => {
    if (!projectId) return;
    debouncedSave(() => {
      storageManager.updateAppState(debouncedState, projectName);
    }, 300);
  }, [debouncedState, storageManager, debouncedSave, projectId, projectName]);

  return {
    saveAppState: useCallback(() => {
      storageManager.updateAppState(state, projectName);
    }, [storageManager, state, projectName]),
    loadAppState: useCallback(() => {
      if (!projectId) return state;
      // Load the full project data and return the appState
      const loadedState = storageManager.loadAppState(projectName);
      console.log("useAppStateStorage: Loaded app state", loadedState);
      return loadedState;
    }, [storageManager, projectId, projectName, state]),
  };
};

// Hook for managing sessions with automatic saving
export const useSessionStorage = (
  storageManager: StorageManager,
  projectId: string | null,
  projectName: string
) => {
  const { debouncedSave } = useStorage(storageManager, projectId);

  const saveActiveSession = useCallback(
    (session: any) => {
      debouncedSave(() => {
        storageManager.saveActiveSession(session, projectName);
      }, 200);
    },
    [storageManager, debouncedSave, projectName]
  );

  const saveSavedSessions = useCallback(
    (sessions: any[]) => {
      debouncedSave(() => {
        storageManager.saveSavedSessions(sessions, projectName);
      }, 200);
    },
    [storageManager, debouncedSave, projectName]
  );

  return {
    saveActiveSession,
    saveSavedSessions,
    loadActiveSession: useCallback(() => {
      if (!projectId) return null;
      return storageManager.loadActiveSession(projectName);
    }, [storageManager, projectId, projectName]),
    loadSavedSessions: useCallback(() => {
      if (!projectId) return [];
      return storageManager.loadSavedSessions(projectName);
    }, [storageManager, projectId, projectName]),
  };
};

// Hook for managing variables with automatic saving
export const useVariableStorage = (
  storageManager: StorageManager,
  projectId: string | null,
  projectName: string
) => {
  const { debouncedSave } = useStorage(storageManager, projectId);

  const saveSharedVariables = useCallback(
    (variables: any[]) => {
      debouncedSave(() => {
        storageManager.saveSharedVariables(variables, projectName);
      }, 200);
    },
    [storageManager, debouncedSave, projectName]
  );

  return {
    saveSharedVariables,
    loadSharedVariables: useCallback(() => {
      if (!projectId) return [];
      return storageManager.loadSharedVariables(projectName);
    }, [storageManager, projectId, projectName]),
  };
};

// Hook for managing token config with automatic saving
export const useTokenConfigStorage = (
  storageManager: StorageManager,
  projectId: string | null,
  projectName: string
) => {
  const { debouncedSave } = useStorage(storageManager, projectId);

  const saveTokenConfig = useCallback(
    (config: any) => {
      debouncedSave(() => {
        storageManager.saveTokenConfig(config, projectName);
      }, 200);
    },
    [storageManager, debouncedSave, projectName]
  );

  return {
    saveTokenConfig,
    loadTokenConfig: useCallback(() => {
      if (!projectId) return null;
      return storageManager.loadTokenConfig(projectName);
    }, [storageManager, projectId, projectName]),
  };
};
