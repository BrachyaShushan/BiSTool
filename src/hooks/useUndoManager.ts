import { useState, useCallback, useRef, useEffect } from "react";
import { ProjectData } from "../utils/storage";

interface UndoState {
  appState: ProjectData["appState"];
  sessions: ProjectData["sessions"];
  variables: ProjectData["variables"];
  timestamp: number;
}

export const useUndoManager = (maxHistorySize: number = 20) => {
  const [history, setHistory] = useState<UndoState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isUndoAvailable, setIsUndoAvailable] = useState(false);
  const [isRedoAvailable, setIsRedoAvailable] = useState(false);
  const isUndoRedoAction = useRef(false);

  // Update availability flags
  useEffect(() => {
    setIsUndoAvailable(currentIndex > 0);
    setIsRedoAvailable(currentIndex < history.length - 1);
  }, [currentIndex, history.length]);

  // Save current state to history
  const saveState = useCallback(
    (state: {
      appState: ProjectData["appState"];
      sessions: ProjectData["sessions"];
      variables: ProjectData["variables"];
    }) => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }

      const newState: UndoState = {
        ...state,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        // Remove any states after current index (for redo)
        const newHistory = prev.slice(0, currentIndex + 1);

        // Add new state
        newHistory.push(newState);

        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
        }

        return newHistory;
      });

      setCurrentIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
    },
    [currentIndex, maxHistorySize]
  );

  // Undo to previous state
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoAction.current = true;
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  // Redo to next state
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  // Get current state
  const getCurrentState = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex];
    }
    return null;
  }, [currentIndex, history]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  // Initialize with current state
  const initialize = useCallback(
    (state: {
      appState: ProjectData["appState"];
      sessions: ProjectData["sessions"];
      variables: ProjectData["variables"];
    }) => {
      const initialState: UndoState = {
        ...state,
        timestamp: Date.now(),
      };
      setHistory([initialState]);
      setCurrentIndex(0);
    },
    []
  );

  return {
    saveState,
    undo,
    redo,
    getCurrentState,
    clearHistory,
    initialize,
    isUndoAvailable,
    isRedoAvailable,
    historyLength: history.length,
    currentIndex,
  };
};
