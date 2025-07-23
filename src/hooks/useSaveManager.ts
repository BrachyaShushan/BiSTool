import { useState, useCallback, useEffect, useRef } from "react";
import { useUndoManager } from "./useUndoManager";
import { ProjectData } from "../utils/storage";
import { useStorage } from "./useStorage";

interface SaveManagerOptions {
  autoSaveEnabled?: boolean;
  autoSaveDelay?: number;
  maxUndoHistory?: number;
  projectId?: string | null;
  unifiedSaveFunction?: (state: any) => void;
}

export const useSaveManager = (
  storageManager: any,
  projectName: string,
  options: SaveManagerOptions = {}
) => {
  const {
    autoSaveEnabled = true,
    autoSaveDelay = 300,
    maxUndoHistory = 20,
    projectId = null,
    unifiedSaveFunction = null,
  } = options;

  // State
  const [autoSave, setAutoSave] = useState(autoSaveEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | undefined>(undefined);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveFrequency, setSaveFrequency] = useState(autoSaveDelay);

  // Refs
  const lastSavedStateRef = useRef<string | null>(null);

  // Hooks
  const undoManager = useUndoManager(maxUndoHistory);
  const { debouncedSave } = useStorage(storageManager, projectId);

  // Reload auto-save setting and save frequency when project changes
  useEffect(() => {
    if (!projectId) {
      setAutoSave(autoSaveEnabled);
      setSaveFrequency(autoSaveDelay);
      return;
    }

    try {
      const projectData = storageManager.getCurrentProjectData(projectName);
      const projectAutoSave = projectData.settings.autoSave;
      const projectSaveFrequency =
        projectData.settings.saveFrequency || autoSaveDelay;

      setAutoSave(projectAutoSave);
      setSaveFrequency(projectSaveFrequency);
    } catch (error) {
      console.error("useSaveManager: Failed to load settings:", error);
      setAutoSave(autoSaveEnabled);
      setSaveFrequency(autoSaveDelay);
    }
  }, [projectId, projectName, autoSaveEnabled, autoSaveDelay]);

  // Manual save function
  const manualSave = useCallback(
    async (state: {
      appState: ProjectData["appState"];
      sessions: ProjectData["sessions"];
      variables: ProjectData["variables"];
    }) => {
      try {
        setIsSaving(true);

        // Use unified save function if provided, otherwise fall back to old logic
        if (unifiedSaveFunction) {
          unifiedSaveFunction(state);
        } else if (projectId) {
          // Project mode - use storage manager
          storageManager.updateAppState(state.appState, projectName);
          storageManager.updateSessions(state.sessions, projectName);
          storageManager.updateVariables(state.variables, projectName);
        } else {
          // Basic mode - save directly to localStorage
          console.log(
            "SaveManager: Manual save in basic mode - saving to localStorage"
          );
          try {
            // Save active session
            if (state.sessions.activeSession) {
              localStorage.setItem(
                "activeSession",
                JSON.stringify(state.sessions.activeSession)
              );
            }
            // Save saved sessions
            if (state.sessions.savedSessions.length > 0) {
              localStorage.setItem(
                "savedSessions",
                JSON.stringify(state.sessions.savedSessions)
              );
            }
            // Save app state
            localStorage.setItem("appState", JSON.stringify(state.appState));
            console.log("SaveManager: Basic mode manual save completed");
          } catch (error) {
            console.error("SaveManager: Error saving to localStorage:", error);
            throw error;
          }
        }

        // Update undo history for manual saves
        undoManager.saveState(state);

        setLastSaved(new Date().toISOString());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Manual save failed:", error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [storageManager, projectName, undoManager, projectId, unifiedSaveFunction]
  );

  // Auto-save function
  const autoSaveChanges = useCallback(
    (state: {
      appState: ProjectData["appState"];
      sessions: ProjectData["sessions"];
      variables: ProjectData["variables"];
    }) => {
      console.log("SaveManager: autoSaveChanges called", {
        projectId,
        autoSave,
        hasUnsavedChanges: lastSavedStateRef.current
          ? "has previous state"
          : "no previous state",
      });

      // Create a more robust comparison by normalizing the state
      const normalizeState = (s: any) => {
        return JSON.stringify({
          appState: s.appState,
          sessions: {
            activeSession: s.sessions.activeSession
              ? {
                  ...s.sessions.activeSession,
                  // Ensure consistent ordering of properties
                  id: s.sessions.activeSession.id,
                  name: s.sessions.activeSession.name,
                  urlData: s.sessions.activeSession.urlData,
                  requestConfig: s.sessions.activeSession.requestConfig,
                  yamlOutput: s.sessions.activeSession.yamlOutput,
                  sharedVariables: s.sessions.activeSession.sharedVariables,
                  segmentVariables: s.sessions.activeSession.segmentVariables,
                }
              : null,
            savedSessions: s.sessions.savedSessions.map((session: any) => ({
              ...session,
              id: session.id,
              name: session.name,
              urlData: session.urlData,
              requestConfig: session.requestConfig,
              yamlOutput: session.yamlOutput,
              sharedVariables: session.sharedVariables,
              segmentVariables: session.segmentVariables,
            })),
          },
          variables: s.variables,
        });
      };

      const currentStateString = normalizeState(state);
      const lastStateString = lastSavedStateRef.current;

      console.log("SaveManager: State comparison", {
        currentStateLength: currentStateString.length,
        lastStateLength: lastStateString?.length || 0,
        statesEqual: currentStateString === lastStateString,
      });

      if (currentStateString !== lastStateString) {
        console.log("SaveManager: State changed, triggering auto-save");
        lastSavedStateRef.current = currentStateString;
        setHasUnsavedChanges(true);

        // Only perform auto-save if auto-save is enabled
        if (autoSave) {
          console.log("SaveManager: Auto-save enabled, scheduling save");
          debouncedSave(() => {
            console.log("SaveManager: Executing save");

            // Use unified save function if provided, otherwise fall back to old logic
            if (unifiedSaveFunction) {
              unifiedSaveFunction(state);
            } else if (projectId) {
              // Project mode - use storage manager
              storageManager.updateAppState(state.appState, projectName);
              storageManager.updateSessions(state.sessions, projectName);
              storageManager.updateVariables(state.variables, projectName);
            } else {
              // Basic mode - save directly to localStorage
              console.log("SaveManager: Basic mode - saving to localStorage");
              try {
                // Save active session
                if (state.sessions.activeSession) {
                  localStorage.setItem(
                    "activeSession",
                    JSON.stringify(state.sessions.activeSession)
                  );
                }
                // Save saved sessions
                if (state.sessions.savedSessions.length > 0) {
                  localStorage.setItem(
                    "savedSessions",
                    JSON.stringify(state.sessions.savedSessions)
                  );
                }
                // Save app state
                localStorage.setItem(
                  "appState",
                  JSON.stringify(state.appState)
                );
                console.log("SaveManager: Basic mode save completed");
              } catch (error) {
                console.error(
                  "SaveManager: Error saving to localStorage:",
                  error
                );
              }
            }

            // Update last saved time and reset unsaved changes flag
            setLastSaved(new Date().toISOString());
            setHasUnsavedChanges(false);
            console.log(
              "SaveManager: Auto-save completed, resetting unsaved changes flag"
            );

            // Don't update undo manager for auto-saves to prevent infinite loops
            // undoManager.saveState(state);
          }, saveFrequency);
        } else {
          console.log("SaveManager: Auto-save disabled");
        }
      } else {
        console.log("SaveManager: No state change detected");
      }
    },
    [
      autoSave,
      debouncedSave,
      storageManager,
      projectName,
      saveFrequency,
      projectId,
      unifiedSaveFunction,
    ]
  );

  // Undo function
  const undo = useCallback(() => {
    const previousState = undoManager.undo();
    if (previousState) {
      // Restore state
      storageManager.updateAppState(previousState.appState, projectName);
      storageManager.updateSessions(previousState.sessions, projectName);
      storageManager.updateVariables(previousState.variables, projectName);

      setLastSaved(new Date().toISOString());
      setHasUnsavedChanges(false);

      return previousState;
    }
    return null;
  }, [undoManager, storageManager, projectName]);

  // Redo function
  const redo = useCallback(() => {
    const nextState = undoManager.redo();
    if (nextState) {
      // Restore state
      storageManager.updateAppState(nextState.appState, projectName);
      storageManager.updateSessions(nextState.sessions, projectName);
      storageManager.updateVariables(nextState.variables, projectName);

      setLastSaved(new Date().toISOString());
      setHasUnsavedChanges(false);

      return nextState;
    }
    return null;
  }, [undoManager, storageManager, projectName]);

  // Toggle auto-save
  const toggleAutoSave = useCallback(
    (enabled: boolean) => {
      setAutoSave(enabled);

      // Save the setting to project settings
      if (projectId) {
        try {
          const projectData = storageManager.getCurrentProjectData(projectName);
          projectData.settings.autoSave = enabled;
          storageManager.saveCurrentProjectData(projectData);
        } catch (error) {
          console.error(
            "useSaveManager: Failed to save auto-save setting:",
            error
          );
        }
      }

      // If turning off auto-save, save current state immediately
      if (!enabled && hasUnsavedChanges) {
        const currentState = undoManager.getCurrentState();
        if (currentState) {
          manualSave(currentState);
        }
      }
    },
    [
      hasUnsavedChanges,
      undoManager,
      manualSave,
      storageManager,
      projectName,
      projectId,
    ]
  );

  // Update save frequency
  const updateSaveFrequency = useCallback(
    (frequency: number) => {
      setSaveFrequency(frequency);

      // Save the setting to project settings
      if (projectId) {
        try {
          const projectData = storageManager.getCurrentProjectData(projectName);
          projectData.settings.saveFrequency = frequency;
          storageManager.saveCurrentProjectData(projectData);
        } catch (error) {
          console.error(
            "useSaveManager: Failed to save save frequency:",
            error
          );
        }
      }
    },
    [storageManager, projectName, projectId]
  );

  // Initialize with current state
  const initialize = useCallback(
    (state: {
      appState: ProjectData["appState"];
      sessions: ProjectData["sessions"];
      variables: ProjectData["variables"];
    }) => {
      undoManager.initialize(state);
      lastSavedStateRef.current = JSON.stringify(state);
      setHasUnsavedChanges(false);
    },
    [undoManager]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "s":
            event.preventDefault();
            const currentState = undoManager.getCurrentState();
            if (currentState) {
              manualSave(currentState);
            }
            break;
          case "z":
            if (event.shiftKey) {
              event.preventDefault();
              redo();
            } else {
              event.preventDefault();
              undo();
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undoManager, manualSave, undo, redo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup is handled by the useStorage hook
    };
  }, []);

  return {
    // State
    autoSave,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveFrequency,

    // Actions
    manualSave,
    autoSaveChanges,
    undo,
    redo,
    toggleAutoSave,
    updateSaveFrequency,
    initialize,

    // Undo manager
    isUndoAvailable: undoManager.isUndoAvailable,
    isRedoAvailable: undoManager.isRedoAvailable,
    historyLength: undoManager.historyLength,
    currentIndex: undoManager.currentIndex,
  };
};
