import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Centralized clipboard utilities to eliminate duplicate clipboard functionality
 */

/**
 * Copy text to clipboard with error handling
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
};

/**
 * Hook for managing clipboard operations with timeout feedback
 */
export const useClipboard = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const copy = useCallback(async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to clear the copied state
      timeoutRef.current = window.setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copy, copiedKey };
};
