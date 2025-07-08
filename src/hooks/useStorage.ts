import { useCallback, useRef, useEffect, useState, useMemo } from "react";
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
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      console.log("useVariableStorage: Saving shared variables:", variables);
      debouncedSave(() => {
        storageManager.saveSharedVariables(variables, projectName);
      }, 200);
    },
    [storageManager, debouncedSave, projectName]
  );

  const saveGlobalVariables = useCallback(
    (variables: Record<string, string>) => {
      console.log("useVariableStorage: Saving global variables:", variables);
      debouncedSave(() => {
        storageManager.saveGlobalVariables(variables, projectName);
      }, 200);
    },
    [storageManager, debouncedSave, projectName]
  );

  return {
    saveSharedVariables,
    saveGlobalVariables,
    loadSharedVariables: useCallback(() => {
      try {
        // Try to get the current project ID from the storage manager
        const currentProjectId = (storageManager as any).currentProjectId;
        if (currentProjectId) {
          const loaded = storageManager.loadSharedVariables(projectName);
          console.log(
            "useVariableStorage: Loaded shared variables from current project:",
            loaded
          );
          return loaded;
        } else {
          // If no current project, try to find the most recent project
          const root = storageManager.getStorageRoot();
          if (root && root.projects && Object.keys(root.projects).length > 0) {
            // Get the first available project
            const projectIds = Object.keys(root.projects);
            const projectId = projectIds[0];
            if (projectId) {
              const projectData = root.projects[projectId];
              if (projectData && projectData.variables) {
                console.log(
                  "useVariableStorage: Loading shared variables from fallback project:",
                  projectId
                );
                return projectData.variables.shared || [];
              }
            }
          }
        }
        console.log(
          "useVariableStorage: No shared variables found, returning empty array"
        );
        return [];
      } catch (error) {
        console.log(
          "useVariableStorage: Could not load shared variables:",
          error
        );
        return [];
      }
    }, [storageManager, projectName]),
    loadGlobalVariables: useCallback(() => {
      try {
        // Try to get the current project ID from the storage manager
        const currentProjectId = (storageManager as any).currentProjectId;
        if (currentProjectId) {
          const loaded = storageManager.loadGlobalVariables(projectName);
          console.log(
            "useVariableStorage: Loaded global variables from current project:",
            loaded
          );
          return loaded;
        } else {
          // If no current project, try to find the most recent project
          const root = storageManager.getStorageRoot();
          if (root && root.projects && Object.keys(root.projects).length > 0) {
            // Get the first available project
            const projectIds = Object.keys(root.projects);
            const projectId = projectIds[0];
            if (projectId) {
              const projectData = root.projects[projectId];
              if (projectData && projectData.variables) {
                console.log(
                  "useVariableStorage: Loading global variables from fallback project:",
                  projectId
                );
                return projectData.variables.global || {};
              }
            }
          }
        }
        console.log(
          "useVariableStorage: No global variables found, returning empty object"
        );
        return {};
      } catch (error) {
        console.log(
          "useVariableStorage: Could not load global variables:",
          error
        );
        return {};
      }
    }, [storageManager, projectName]),
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

  const loadTokenConfig = useCallback(() => {
    if (!projectId) return null;
    return storageManager.loadTokenConfig(projectName);
  }, [storageManager, projectId, projectName]);

  // Memoize the return object to prevent recreation on every render
  return useMemo(
    () => ({
      saveTokenConfig,
      loadTokenConfig,
    }),
    [saveTokenConfig, loadTokenConfig]
  );
};

// Hook for managing mode with automatic saving
export const useModeStorage = (
  storageManager: StorageManager,
  projectId: string | null,
  projectName: string
) => {
  const { debouncedSave } = useStorage(storageManager, projectId);

  const saveMode = useCallback(
    (mode: "basic" | "expert") => {
      debouncedSave(() => {
        storageManager.saveMode(mode, projectName);
      }, 200);
    },
    [storageManager, debouncedSave, projectName]
  );

  return {
    saveMode,
    loadMode: useCallback(() => {
      if (!projectId) return "expert" as const;
      return storageManager.loadMode(projectName);
    }, [storageManager, projectId, projectName]),
  };
};
