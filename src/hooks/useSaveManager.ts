import { useState, useCallback, useEffect, useRef } from "react";
import { useUndoManager } from "./useUndoManager";
import { ProjectData } from "../utils/storage";

interface SaveManagerOptions {
  autoSaveEnabled?: boolean;
  autoSaveDelay?: number;
  maxUndoHistory?: number;
  projectId?: string | null;
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
  } = options;

  // Load auto-save setting from project settings
  const [autoSave, setAutoSave] = useState(() => {
    if (!projectId) {
      return autoSaveEnabled;
    }
    try {
      const projectData = storageManager.getCurrentProjectData(projectName);
      const projectAutoSave = projectData.settings.autoSave;
      return projectAutoSave;
    } catch (error) {
      console.error("useSaveManager: Failed to load auto-save setting:", error);
      return autoSaveEnabled;
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | undefined>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Load save frequency from project settings
  const [saveFrequency, setSaveFrequency] = useState(() => {
    if (!projectId) return autoSaveDelay;
    try {
      const projectData = storageManager.getCurrentProjectData(projectName);
      return projectData.settings.saveFrequency || autoSaveDelay;
    } catch (error) {
      console.error("Failed to load save frequency:", error);
      return autoSaveDelay;
    }
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedStateRef = useRef<string>("");

  const undoManager = useUndoManager(maxUndoHistory);

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

  // Debounced save function
  const debouncedSave = useCallback(
    (saveFn: () => void, delay?: number) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        try {
          setIsSaving(true);
          saveFn();
          setLastSaved(new Date().toISOString());
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error("Save error:", error);
        } finally {
          setIsSaving(false);
        }
      }, delay || saveFrequency);
    },
    [saveFrequency]
  );

  // Manual save function
  const manualSave = useCallback(
    async (state: {
      appState: ProjectData["appState"];
      sessions: ProjectData["sessions"];
      variables: ProjectData["variables"];
    }) => {
      if (!projectId) return;

      try {
        setIsSaving(true);

        // Save to storage
        storageManager.updateAppState(state.appState, projectName);
        storageManager.updateSessions(state.sessions, projectName);
        storageManager.updateVariables(state.variables, projectName);

        // Update undo history
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
    [storageManager, projectName, undoManager, projectId]
  );

  // Auto-save function
  const autoSaveChanges = useCallback(
    (state: {
      appState: ProjectData["appState"];
      sessions: ProjectData["sessions"];
      variables: ProjectData["variables"];
    }) => {
      if (!projectId) return;

      const stateString = JSON.stringify(state);
      if (stateString !== lastSavedStateRef.current) {
        lastSavedStateRef.current = stateString;
        setHasUnsavedChanges(true);

        // Only perform auto-save if auto-save is enabled
        if (autoSave) {
          debouncedSave(() => {
            storageManager.updateAppState(state.appState, projectName);
            storageManager.updateSessions(state.sessions, projectName);
            storageManager.updateVariables(state.variables, projectName);
            undoManager.saveState(state);
          }, saveFrequency);
        }
      }
    },
    [
      autoSave,
      debouncedSave,
      storageManager,
      projectName,
      undoManager,
      saveFrequency,
      projectId,
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
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
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
