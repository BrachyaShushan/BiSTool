import { useCallback, useRef, useEffect, useState } from "react";
import { StorageManager } from "../utils/storage";

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
export const useStorage = (storageManager: StorageManager) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  state: {
    urlData: any;
    requestConfig: any;
    yamlOutput: string;
    activeSection: any;
    segmentVariables: Record<string, string>;
    globalVariables: Record<string, string>;
  }
) => {
  const { debouncedSave } = useStorage(storageManager);

  // Debounce the state to avoid excessive saves
  const debouncedState = useDebounce(state, 500);

  // Auto-save when state changes
  useEffect(() => {
    debouncedSave(() => {
      storageManager.saveAppState(debouncedState);
    }, 300);
  }, [debouncedState, storageManager, debouncedSave]);

  return {
    saveAppState: useCallback(() => {
      storageManager.saveAppState(state);
    }, [storageManager, state]),
    loadAppState: useCallback(() => {
      return storageManager.loadAppState();
    }, [storageManager]),
  };
};

// Hook for managing sessions with automatic saving
export const useSessionStorage = (storageManager: StorageManager) => {
  const { debouncedSave } = useStorage(storageManager);

  const saveActiveSession = useCallback(
    (session: any) => {
      debouncedSave(() => {
        storageManager.saveActiveSession(session);
      }, 200);
    },
    [storageManager, debouncedSave]
  );

  const saveSavedSessions = useCallback(
    (sessions: any[]) => {
      debouncedSave(() => {
        storageManager.saveSavedSessions(sessions);
      }, 200);
    },
    [storageManager, debouncedSave]
  );

  return {
    saveActiveSession,
    saveSavedSessions,
    loadActiveSession: useCallback(
      () => storageManager.loadActiveSession(),
      [storageManager]
    ),
    loadSavedSessions: useCallback(
      () => storageManager.loadSavedSessions(),
      [storageManager]
    ),
  };
};

// Hook for managing variables with automatic saving
export const useVariableStorage = (storageManager: StorageManager) => {
  const { debouncedSave } = useStorage(storageManager);

  const saveSharedVariables = useCallback(
    (variables: any[]) => {
      debouncedSave(() => {
        storageManager.saveSharedVariables(variables);
      }, 200);
    },
    [storageManager, debouncedSave]
  );

  return {
    saveSharedVariables,
    loadSharedVariables: useCallback(
      () => storageManager.loadSharedVariables(),
      [storageManager]
    ),
  };
};

// Hook for managing token config with automatic saving
export const useTokenConfigStorage = (storageManager: StorageManager) => {
  const { debouncedSave } = useStorage(storageManager);

  const saveTokenConfig = useCallback(
    (config: any) => {
      debouncedSave(() => {
        storageManager.saveTokenConfig(config);
      }, 200);
    },
    [storageManager, debouncedSave]
  );

  return {
    saveTokenConfig,
    loadTokenConfig: useCallback(
      () => storageManager.loadTokenConfig(),
      [storageManager]
    ),
  };
};
